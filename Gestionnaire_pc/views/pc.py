from django.http import JsonResponse    
from django.utils import timezone
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
import json
from ..models import Employe,PC,Pc_attribué,Pc_ancien,marquePC,modelePC,Email_DOT,DemandeAchatPeripherique, Pc_ancien_attribue, Bordereau,Email,Email_RDOT,Email_DCH
from django.db.models import Q
from datetime import datetime, timedelta

  
def ajouter_pc(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
           
            marque_name = data.get('marque')
            if not marque_name:
                return JsonResponse({'error': 'Marque manquante.'}, status=400)
            marque_instance, created = marquePC.objects.get_or_create(nom_marque=marque_name)

            modele_name = data.get('model')
            if not modele_name:
                return JsonResponse({'error': 'Modèle manquant.'}, status=400)
            modele_instance, created = modelePC.objects.get_or_create(nom_modele=modele_name)

            processeur = data.get('processeur')
            ram = data.get('ram')
            disque_dur = data.get('disque')
            numero_serie = data.get('serial')
            date_achat = data.get('dateAchat')
            
            pc = PC.objects.create(
                marque=marque_instance,
                modele=modele_instance,
                processeur=processeur,
                ram=ram,
                disque_dur=disque_dur,
                numero_serie=numero_serie,
                date_achat=date_achat
            )
            email_sent = False
            email_id = None
            try:
                expediteur = None
                try:
                    user_id = request.session.get('user_id')
                    if user_id:
                        expediteur = Employe.objects.filter(id_employe=user_id).first()
                except Exception:
                    expediteur = None

                # Construire l'email
                sujet = f"Nouveau ordinateur ajouté - {marque_instance.nom_marque} {modele_instance.nom_modele} ({numero_serie})"
                corps_message = f"""
Un nouveau ordinateur a été ajouté dans le système.

Détails de l'ordinateur:
- Marque: {marque_instance.nom_marque}
- Modèle: {modele_instance.nom_modele}
- Processeur: {processeur or ''}
- RAM: {ram or ''}
- Disque: {disque_dur or ''}
- Numéro de série: {numero_serie}
- Date d'achat: {date_achat or ''}

Ajouté le: {datetime.now().strftime('%d/%m/%Y à %H:%M')}
                """.strip()
                # Enregistrer l'email en base
                email = Email_DOT.objects.create(
                    destinataire="kaogeorges2006@gmail.com",
                    objet=sujet,
                    corps=corps_message,
                    expediteur=expediteur
                )
                email_id = email.id_email
                # Envoyer l'email réellement
                try:
                    send_mail(
                        subject=sujet,
                        message=corps_message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=["kaogeorges2006@gmail.com"],
                        fail_silently=False,
                    )
                    email_sent = True
                except Exception:
                    # L'envoi peut échouer sans bloquer l'ajout du PC
                    email_sent = False
            except Exception:
                email_sent = False

            return JsonResponse({'message': 'PC ajouté avec succès!', 'id': pc.pk, 'email_id': email_id, 'email_sent': email_sent})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)

def supprimer_pc(request, pc_id):
    if request.method == 'POST':
        try:
            pc = PC.objects.get(pk=pc_id)
            pc.delete()
            return JsonResponse({'message': 'PC supprimé avec succès!'})
        except PC.DoesNotExist:
            return JsonResponse({'error': 'PC non trouvé.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)


def modifier_pc(request, pc_id):
    if request.method == 'POST':
        try:
            pc = PC.objects.get(pk=pc_id)
            data = json.loads(request.body)
            marque_name = data.get('marque')
            if marque_name:
                marque_instance, created = marquePC.objects.get_or_create(nom_marque=marque_name)
                pc.marque = marque_instance

            modele_name = data.get('model')
            if modele_name:
                modele_instance, created = modelePC.objects.get_or_create(nom_modele=modele_name)
                pc.modele = modele_instance

            pc.processeur = data.get('processeur', pc.processeur)
            pc.ram = data.get('ram', pc.ram)
            pc.disque_dur = data.get('disque', pc.disque_dur)
            pc.numero_serie = data.get('serial', pc.numero_serie)
            pc.date_achat = data.get('dateAchat', pc.date_achat)
            
            pc.save()
            return JsonResponse({'message': 'PC modifié avec succès!'})
        except PC.DoesNotExist:
            return JsonResponse({'error': 'PC non trouvé.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)

def assign_pc_via_form(request):
    if request.method == 'POST':
        try:
            if request.content_type and 'application/json' in request.content_type:
                data = json.loads(request.body or '{}')
            else:
                data = request.POST

            employe_id = data.get('employe_id')
            date_attribution_str = data.get('date_attribution')
            numero_serie = data.get('numero_serie')

            if not (employe_id and date_attribution_str and numero_serie):
                return JsonResponse({'error': 'Champs requis manquants (employe_id, numero_serie, date_attribution).'}, status=400)

            try:
                employe = Employe.objects.get(id_employe=employe_id)
            except Employe.DoesNotExist:
                return JsonResponse({'error': 'Employé non trouvé.'}, status=404)
            try:
                pc = PC.objects.get(numero_serie=numero_serie)
            except PC.DoesNotExist:
                if Pc_attribué.objects.filter(numero_serie=numero_serie, employe__id_employe=employe_id).exists():
                    return JsonResponse({'message': 'PC déjà attribué (requête répétée ignorée).'}, status=200)
                return JsonResponse({'error': 'Numéro de série inconnu ou non conforme au PC.'}, status=400)
            date_attribution = datetime.strptime(date_attribution_str, '%Y-%m-%d').date()
            Pc_attribué.objects.create(
                marque=pc.marque.nom_marque,
                modele=pc.modele.nom_modele,
                ram=pc.ram,
                disque_dur=pc.disque_dur, 
                processeur=pc.processeur, 
                numero_serie=pc.numero_serie, 
                date_achat=pc.date_achat, 
                employe=employe,
                date_attribution=date_attribution
            )
            pc.delete()
            return JsonResponse({'message': 'PC attribué et archivé avec succès !'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)

def pc_disponible():
    return PC.objects.count()


    
def gestion_modeles(request):
    if request.method == 'GET':
        modeles = list(modelePC.objects.values())
        return JsonResponse({'modeles': modeles})

    elif request.method == 'POST':
        data = json.loads(request.body)
        nom = data.get('nom')
        if nom:
            _, created = modelePC.objects.get_or_create(nom_modele=nom)
            return JsonResponse({'message': 'Modèle ajouté.'})
        return JsonResponse({'error': 'Nom manquant'}, status=400)

    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
        except Exception:
            return JsonResponse({'error': 'Corps de requête invalide'}, status=400)
        ancien = (data.get('old') or data.get('ancien') or '').strip()
        nouveau = (data.get('nom') or data.get('new') or '').strip()
        if not ancien or not nouveau:
            return JsonResponse({'error': 'Champs requis: old et nom'}, status=400)
        if ancien.lower() == nouveau.lower():
            return JsonResponse({'message': 'Aucune modification nécessaire'})
        obj = modelePC.objects.filter(nom_modele=ancien).first()
        if not obj:
            return JsonResponse({'error': 'Modèle introuvable'}, status=404)
        # Empêcher doublon (case-insensible)
        if modelePC.objects.filter(nom_modele__iexact=nouveau).exclude(pk=obj.pk).exists():
            return JsonResponse({'error': 'Un modèle avec ce nom existe déjà'}, status=409)
        obj.nom_modele = nouveau
        obj.save(update_fields=['nom_modele'])
        return JsonResponse({'message': 'Modèle modifié.'})

    elif request.method == 'DELETE':
        data = json.loads(request.body)
        nom = data.get('nom')
        modele = modelePC.objects.filter(nom_modele=nom).first()
        if modele:
            modele.delete()
            return JsonResponse({'message': 'Modèle supprimé.'})
        return JsonResponse({'error': 'Modèle introuvable'}, status=404)
    
   
def gestion_marques(request):
    if request.method == 'GET':
        marques = list(marquePC.objects.values())
        return JsonResponse({'marques': marques})

    elif request.method == 'POST':
        data = json.loads(request.body)
        nom = data.get('nom')
        if nom:
            _, created = marquePC.objects.get_or_create(nom_marque=nom)
            return JsonResponse({'message': 'Marque ajoutée.'})
        return JsonResponse({'error': 'Nom manquant'}, status=400)

    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
        except Exception:
            return JsonResponse({'error': 'Corps de requête invalide'}, status=400)
        ancien = (data.get('old') or data.get('ancien') or '').strip()
        nouveau = (data.get('nom') or data.get('new') or '').strip()
        if not ancien or not nouveau:
            return JsonResponse({'error': 'Champs requis: old et nom'}, status=400)
        if ancien.lower() == nouveau.lower():
            return JsonResponse({'message': 'Aucune modification nécessaire'})
        obj = marquePC.objects.filter(nom_marque=ancien).first()
        if not obj:
            return JsonResponse({'error': 'Marque introuvable'}, status=404)
        # Empêcher doublon (case-insensible)
        if marquePC.objects.filter(nom_marque__iexact=nouveau).exclude(pk=obj.pk).exists():
            return JsonResponse({'error': 'Une marque avec ce nom existe déjà'}, status=409)
        obj.nom_marque = nouveau
        obj.save(update_fields=['nom_marque'])
        return JsonResponse({'message': 'Marque modifiée.'})

    elif request.method == 'DELETE':
        data = json.loads(request.body)
        nom = data.get('nom')
        marque = marquePC.objects.filter(nom_marque=nom).first()
        if marque:
            marque.delete()
            return JsonResponse({'message': 'Marque supprimée.'})
        return JsonResponse({'error': 'Marque introuvable'}, status=404)


# =================== Gestion des attributions (modifier/supprimer) ===================
def supprimer_attribution(request, attribution_id):
    """Supprime une attribution Pc_attribué et les bordereaux associés. POST requis."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)
    try:
        pa = Pc_attribué.objects.select_related('employe').get(pk=attribution_id)

        with transaction.atomic():
            deleted_bordereaux = 0
            q = Q()
            # Associer par numéro de série
            if hasattr(Bordereau, 'numero_serie_pc') and getattr(pa, 'numero_serie', None):
                q |= Q(numero_serie_pc=pa.numero_serie)
            # Associer par FK employé si présent sur le modèle Bordereau
            if hasattr(Bordereau, 'employe') and getattr(pa, 'employe_id', None):
                q |= Q(employe_id=pa.employe_id)
            # Fallback: nom/prénom si champs texte
            if (hasattr(Bordereau, 'nom_employe') and hasattr(Bordereau, 'prenom_employe') and getattr(pa, 'employe', None)):
                q |= Q(nom_employe=pa.employe.nom, prenom_employe=pa.employe.prenom)

            if q:
                try:
                    deleted_bordereaux, _ = Bordereau.objects.filter(q).delete()
                except Exception:
                    deleted_bordereaux = 0

            pa.delete()

        return JsonResponse({'message': 'Attribution supprimée avec succès!', 'bordereaux_supprimes': deleted_bordereaux})
    except Pc_attribué.DoesNotExist:
        return JsonResponse({'error': 'Attribution introuvable.'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


def modifier_attribution(request, attribution_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)
    try:
        pa = Pc_attribué.objects.get(pk=attribution_id)
    except Pc_attribué.DoesNotExist:
        return JsonResponse({'error': 'Attribution introuvable.'}, status=404)
    try:
        data = json.loads(request.body or '{}')
    except Exception:
        data = {}

    try:
        emp_id = data.get('employe_id')
        if emp_id:
            try:
                emp = Employe.objects.get(id_employe=int(emp_id))
                pa.employe = emp
            except Employe.DoesNotExist:
                return JsonResponse({'error': 'Employé introuvable.'}, status=404)

        if 'marque' in data and data['marque']:
            pa.marque = data['marque']
        if 'modele' in data and data['modele']:
            pa.modele = data['modele']
        if 'numero_serie' in data and data['numero_serie']:
            pa.numero_serie = data['numero_serie']
        if 'processeur' in data and data['processeur']:
            pa.processeur = data['processeur']
        if 'ram' in data and data['ram']:
            pa.ram = data['ram']
        if 'disque_dur' in data and data['disque_dur']:
            pa.disque_dur = data['disque_dur']
        if 'date_attribution' in data and data['date_attribution']:
            try:
                pa.date_attribution = datetime.strptime(data['date_attribution'], '%Y-%m-%d').date()
            except Exception:
                return JsonResponse({'error': 'date_attribution invalide (YYYY-MM-DD).'}, status=400)

        pa.save()
        return JsonResponse({'message': 'Attribution modifiée avec succès!'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


def changer_pc_attribution(request, attribution_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)
    try:
        pa = Pc_attribué.objects.get(pk=attribution_id)
    except Pc_attribué.DoesNotExist:
        return JsonResponse({'error': 'Attribution introuvable.'}, status=404)
    try:
        data = json.loads(request.body or '{}')
    except Exception:
        data = {}
    numero_serie_nouveau = (data.get('numero_serie') or '').strip()
    if not numero_serie_nouveau:
        return JsonResponse({'error': 'numero_serie requis'}, status=400)
    # Récupérer le nouveau PC en stock
    try:
        pc_new = PC.objects.get(numero_serie=numero_serie_nouveau)
    except PC.DoesNotExist:
        return JsonResponse({'error': 'PC sélectionné introuvable en stock.'}, status=404)

    # Transaction pour garder la cohérence stock/attribution
    try:
        with transaction.atomic():
            # Remettre l'ancien PC attribué en stock
            # Rechercher/Créer les entités marque/modele nécessaires
            m_obj, _ = marquePC.objects.get_or_create(nom_marque=pa.marque)
            mo_obj, _ = modelePC.objects.get_or_create(nom_modele=pa.modele)
            PC.objects.create(
                marque=m_obj,
                modele=mo_obj,
                processeur=pa.processeur or '',
                ram=pa.ram or '',
                disque_dur=pa.disque_dur or '',
                numero_serie=pa.numero_serie,
                date_achat=pa.date_achat
            )

            # Mettre à jour l'attribution avec les specs du nouveau PC
            pa.marque = pc_new.marque.nom_marque
            pa.modele = pc_new.modele.nom_modele
            pa.processeur = pc_new.processeur
            pa.ram = pc_new.ram
            pa.disque_dur = pc_new.disque_dur
            pa.numero_serie = pc_new.numero_serie
            # Optionnel: mettre à jour la date d'attribution si fournie
            d_attr = data.get('date_attribution')
            if d_attr:
                try:
                    pa.date_attribution = datetime.strptime(d_attr, '%Y-%m-%d').date()
                except Exception:
                    return JsonResponse({'error': 'date_attribution invalide (YYYY-MM-DD).'}, status=400)
            pa.save()

            # Retirer le nouveau PC du stock
            pc_new.delete()

        return JsonResponse({'message': 'PC attribué changé avec succès!'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

# Ajouter un PC directement dans Pc_ancien (manuel)
def ajouter_pc_ancien(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)
    try:
        if request.content_type and 'application/json' in request.content_type:
            data = json.loads(request.body)
        else:
            data = request.POST

        marque = data.get('marque') or data.get('brand')
        modele = data.get('model')
        processeur = data.get('processeur')
        ram = data.get('ram')
        disque_dur = data.get('disque')
        numero_serie = data.get('serial')
        date_achat = data.get('dateAchat')
        employe_id = data.get('employe_id')

        employe = None
        if employe_id:
            try:
                employe = Employe.objects.get(id_employe=int(employe_id))
            except Employe.DoesNotExist:
                return JsonResponse({'error': "Employé introuvable"}, status=404)

        if not (marque and modele and numero_serie):
            return JsonResponse({'error': 'Champs requis manquants (marque, modèle, numéro de série).'}, status=400)

        # Création du snapshot dans Pc_ancien
        pc_a = Pc_ancien.objects.create(
            marque=marque,
            modele=modele,
            numero_serie=numero_serie,
            processeur=processeur or '',
            ram=ram or '',
            disque_dur=disque_dur or '',
            date_achat=date_achat or None,
            employe=employe,
        )

        return JsonResponse({'message': 'PC ancien ajouté avec succès', 'id': pc_a.id_ancien})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


# Attribuer un PC ancien à un employé
def assign_pc_ancien(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)
    try:
        data = json.loads(request.body)
        ancien_id = data.get('ancien_id')
        employe_id = data.get('employe_id')
        date_attr = data.get('date_attribution')
        date_fin = data.get('date_fin_attribution')

        if not (ancien_id and employe_id):
            return JsonResponse({'error': 'ancien_id et employe_id sont requis'}, status=400)

        try:
            pc_a = Pc_ancien.objects.get(id_ancien=int(ancien_id))
        except Pc_ancien.DoesNotExist:
            return JsonResponse({'error': 'PC ancien introuvable'}, status=404)

        try:
            employe = Employe.objects.get(id_employe=int(employe_id))
        except Employe.DoesNotExist:
            return JsonResponse({'error': 'Employé introuvable'}, status=404)

        # Sauvegarder les données du PC ancien avant suppression
        pc_data = {
            'marque': pc_a.marque,
            'modele': pc_a.modele,
            'numero_serie': pc_a.numero_serie,
            'processeur': pc_a.processeur,
            'ram': pc_a.ram,
            'disque_dur': pc_a.disque_dur,
            'date_achat': pc_a.date_achat,
        }

        # Traitement des dates
        from datetime import datetime as _dt
        if date_attr:
            try:
                date_attribution = _dt.strptime(date_attr, '%Y-%m-%d').date()
            except Exception:
                return JsonResponse({'error': "date_attribution invalide (YYYY-MM-DD)"}, status=400)
        else:
            date_attribution = timezone.localdate()

        date_fin_attribution = None
        if date_fin:
            try:
                date_fin_attribution = _dt.strptime(date_fin, '%Y-%m-%d').date()
            except Exception:
                return JsonResponse({'error': "date_fin_attribution invalide (YYYY-MM-DD)"}, status=400)

        # Supprimer le PC ancien du catalogue
        pc_a.delete()

        # Créer l'attribution avec les données sauvegardées
        Pc_ancien_attribue.objects.create(
            marque=pc_data['marque'],
            modele=pc_data['modele'],
            numero_serie=pc_data['numero_serie'],
            processeur=pc_data['processeur'],
            ram=pc_data['ram'],
            disque_dur=pc_data['disque_dur'],
            date_achat=pc_data['date_achat'],
            employe=employe,
            date_attribution=date_attribution,
            date_fin_attribution=date_fin_attribution,
        )

        return JsonResponse({'message': 'PC ancien attribué avec succès'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)



def restituer_pc(request):
    if request.method == 'POST':
        try:
            motif = request.POST.get('motif')
            autre_motif = request.POST.get('autre_motif', '')
            date_restitution = request.POST.get('date_restitution')
            commentaires = request.POST.get('commentaires', '')

            user_id = request.session.get('user_id')
            
            if not user_id:
                return JsonResponse({'error': 'Utilisateur non connecté.'}, status=401)
            
            try:
                employe = Employe.objects.get(id_employe=user_id)
            except Employe.DoesNotExist:
                return JsonResponse({'error': 'Employé non trouvé.'}, status=404)

            try:
                pc_attribue = Pc_attribué.objects.get(employe=employe)
            except Pc_attribué.DoesNotExist:
                return JsonResponse({'error': 'Aucun PC attribué trouvé pour cet employé.'}, status=404)
            except Pc_attribué.MultipleObjectsReturned: 
                pc_attribue = Pc_attribué.objects.filter(employe=employe).first()
              

            objet = f"Demande de restitution - {motif}"
            if motif == "Autre" and autre_motif:
                objet = f"Demande de restitution - {autre_motif}"
            
            corps_message = f"""
Nouvelle demande de restitution de PC

Employé : {employe.prenom} {employe.nom}
Fonction : {employe.fonction}
Département : {employe.Département}

PC à restituer :
- Marque : {pc_attribue.marque}
- Modèle : {pc_attribue.modele}
- Numéro de série : {pc_attribue.numero_serie}

Motif de restitution : {motif}
"""
            
            if motif == "Autre" and autre_motif:
                corps_message += f"Motif précisé : {autre_motif}\n"
                
            corps_message += f"Date de restitution prévue : {date_restitution}\n"
            
            if commentaires:
                corps_message += f"\nCommentaires additionnels :\n{commentaires}\n"
            
            corps_message += f"\nDate de la demande : {datetime.now().strftime('%d/%m/%Y à %H:%M')}"
            
            # Enregistrer l'email dans la base de données
            email = Email_RDOT.objects.create(
                destinataire="kaogeorges2006@gmail.com",
                objet=objet,
                corps=corps_message,
                expediteur=employe
            )
            
            # Envoyer l'email réellement
            try:
                send_mail(
                    subject=objet,
                    message=corps_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=["kaogeorges2006@gmail.com"],
                    fail_silently=False,
                )
                email_envoyé = True
                message_status = "Email envoyé et enregistré avec succès!"
            except Exception as e:
                email_envoyé = False
                message_status = f"Email enregistré mais erreur d'envoi: {str(e)}"
            
            return JsonResponse({
                'message': message_status,
                'email_id': email.id_email,
                'email_sent': email_envoyé
            })

        except Exception as e:
            return JsonResponse({'error': f'Erreur lors de l\'envoi de la demande: {str(e)}'}, status=400)

    return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)




def demande_achat_peripheriques(request):
    if request.method == 'POST':
        try:
            # Récupérer les données du formulaire
            materiel = request.POST.get('materiel')
            objet_demande = request.POST.get('caracteristique', 'Demande d\'achat de périphérique')
            commentaires = request.POST.get('commentaires', '')
            
            # Récupérer l'utilisateur connecté depuis la session
            connected_user_id = request.session.get('user_id')
            if not connected_user_id:
                return JsonResponse({'error': 'Utilisateur non connecté.'}, status=401)

            try:
                connected_user = Employe.objects.get(id_employe=connected_user_id)
            except Employe.DoesNotExist:
                return JsonResponse({'error': 'Employé non trouvé.'}, status=404)

            # Validation des données
            if not materiel:
                return JsonResponse({'error': 'Veuillez sélectionner un matériel.'}, status=400)

            # Créer la demande d'achat dans la nouvelle table
            demande = DemandeAchatPeripherique.objects.create(
                employe=connected_user,
                materiel=materiel,
                objet_demande=objet_demande,
                commentaires=commentaires,
                statut='en_attente'
            )

            # Construire l'objet et le corps du message pour l'email
            objet = f"{connected_user.nom} {connected_user.prenom} - {objet_demande} - {materiel}"
            
            corps_message = f"""
Nouvelle demande d'achat de périphérique

Employé : {connected_user.prenom} {connected_user.nom}
Fonction : {connected_user.fonction}
Département : {connected_user.Département}
Matricule : {connected_user.matricule}
Téléphone : {connected_user.telephone}

Demande :
- Type de demande : {objet_demande}
- Matériel demandé : {materiel}
"""
            
            if commentaires:
                corps_message += f"\nCommentaires additionnels :\n{commentaires}\n"
            
            corps_message += f"\nDate de la demande : {datetime.now().strftime('%d/%m/%Y à %H:%M')}"
            corps_message += f"\nNuméro de demande : {demande.id_demande}"

            # Enregistrer l'email dans la base de données
            email = Email_RDOT.objects.create(
                destinataire="kaogeorges2006@gmail.com",
                objet=objet,
                corps=corps_message,
                expediteur=connected_user
            )

            # Envoyer l'email réellement
            try:
                send_mail(
                    subject=objet,
                    message=corps_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=["kaogeorges2006@gmail.com"],
                    fail_silently=False,
                )
                email_envoyé = True
                message_status = "Demande d'achat de périphérique envoyée avec succès!"
            except Exception as e:
                email_envoyé = False
                message_status = f"Demande enregistrée mais erreur d'envoi: {str(e)}"

            return JsonResponse({
                'message': message_status,
                'email_id': email.id_email,
                'demande_id': demande.id_demande,
                'email_sent': email_envoyé
            })

        except Exception as e:
            return JsonResponse({'error': f'Erreur lors de l\'envoi de la demande: {str(e)}'}, status=400)

    return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)


# Amortissement manuel des PCs (déplacement des PCs de plus de 4 ans vers Pc_ancien)
def amortir_pcs(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)
    try:
        today = timezone.localdate()
        cutoff = today - timedelta(days=4*365)

        moved = 0
        with transaction.atomic():
            pcs = list(PC.objects.select_for_update().filter(date_achat__isnull=False, date_achat__lte=cutoff))
            for pc in pcs:
                # Les PC de la table PC ne sont pas attribués; on ne met pas d'employé
                Pc_ancien.objects.create(
                    marque=pc.marque.nom_marque,
                    modele=pc.modele.nom_modele,
                    numero_serie=pc.numero_serie,
                    processeur=pc.processeur,
                    ram=pc.ram,
                    disque_dur=pc.disque_dur,
                    date_achat=pc.date_achat,
                )
                pc.delete()
                moved += 1

            # Amortir aussi les PCs attribués dont la date d'attribution dépasse 4 ans
            attribues = list(Pc_attribué.objects.select_for_update().filter(date_attribution__isnull=False, date_attribution__lte=cutoff))
            for pa in attribues:
                Pc_ancien.objects.create(
                    marque=pa.marque,
                    modele=pa.modele,
                    numero_serie=pa.numero_serie,
                    processeur=pa.processeur,
                    ram=pa.ram,
                    disque_dur=pa.disque_dur,
                    date_achat=pa.date_achat,
                    employe=pa.employe,
                )
                pa.delete()
                moved += 1
        return JsonResponse({'ok': True, 'moved': moved})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


# Modifier un PC ancien (utilise la même modale que l'ajout, en mode édition)
def modifier_pc_ancien(request, ancien_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)
    try:
        if request.content_type and 'application/json' in request.content_type:
            data = json.loads(request.body)
        else:
            data = request.POST

        try:
            pc_a = Pc_ancien.objects.get(id_ancien=int(ancien_id))
        except Pc_ancien.DoesNotExist:
            return JsonResponse({'error': 'PC ancien introuvable'}, status=404)

        marque = data.get('marque') or data.get('brand')
        modele = data.get('model')
        processeur = data.get('processeur')
        ram = data.get('ram')
        disque_dur = data.get('disque')
        numero_serie = data.get('serial')
        date_achat = data.get('dateAchat')
        employe_id = data.get('employe_id')

        # Validation minimale (comme l'ajout)
        if not (marque and modele and numero_serie):
            return JsonResponse({'error': 'Champs requis manquants (marque, modèle, numéro de série).'}, status=400)

        employe = None
        if employe_id:
            try:
                employe = Employe.objects.get(id_employe=int(employe_id))
            except Employe.DoesNotExist:
                return JsonResponse({'error': "Employé introuvable"}, status=404)

        pc_a.marque = marque
        pc_a.modele = modele
        pc_a.numero_serie = numero_serie
        pc_a.processeur = processeur or ''
        pc_a.ram = ram or ''
        pc_a.disque_dur = disque_dur or ''
        pc_a.date_achat = date_achat or None
        pc_a.employe = employe
        pc_a.save()

        return JsonResponse({'message': 'PC ancien modifié avec succès'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


# Supprimer un PC ancien
def supprimer_pc_ancien(request, ancien_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)
    try:
        try:
            pc_a = Pc_ancien.objects.get(id_ancien=int(ancien_id))
        except Pc_ancien.DoesNotExist:
            return JsonResponse({'error': 'PC ancien introuvable'}, status=404)

        # La suppression en cascade retirera aussi les attributions liées (ForeignKey CASCADE)
        pc_a.delete()
        return JsonResponse({'message': 'PC ancien supprimé avec succès'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


# =================== PC anciens attribués: modifier / supprimer ===================
def supprimer_pc_ancien_attribue(request, attribue_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)
    try:
        try:
            obj = Pc_ancien_attribue.objects.get(pk=attribue_id)
        except Pc_ancien_attribue.DoesNotExist:
            return JsonResponse({'error': 'PC ancien attribué introuvable.'}, status=404)
        obj.delete()
        return JsonResponse({'message': 'PC ancien attribué supprimé avec succès'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


def modifier_pc_ancien_attribue(request, attribue_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)
    try:
        try:
            obj = Pc_ancien_attribue.objects.get(pk=attribue_id)
        except Pc_ancien_attribue.DoesNotExist:
            return JsonResponse({'error': 'PC ancien attribué introuvable.'}, status=404)

        if request.content_type and 'application/json' in request.content_type:
            try:
                data = json.loads(request.body or '{}')
            except Exception:
                data = {}
        else:
            data = request.POST

        # Mise à jour des champs basiques
        for field in ['marque', 'modele', 'numero_serie', 'processeur', 'ram', 'disque_dur']:
            if field in data and data.get(field) is not None:
                setattr(obj, field, data.get(field))

        # Dates
        from datetime import datetime as _dt
        if 'date_attribution' in data and data.get('date_attribution'):
            try:
                obj.date_attribution = _dt.strptime(data.get('date_attribution'), '%Y-%m-%d').date()
            except Exception:
                return JsonResponse({'error': 'date_attribution invalide (YYYY-MM-DD).'}, status=400)
        if 'date_fin_attribution' in data:
            val = data.get('date_fin_attribution')
            if val:
                try:
                    obj.date_fin_attribution = _dt.strptime(val, '%Y-%m-%d').date()
                except Exception:
                    return JsonResponse({'error': 'date_fin_attribution invalide (YYYY-MM-DD).'}, status=400)
            else:
                obj.date_fin_attribution = None

        # Employé
        emp_id = data.get('employe_id') or data.get('employe')
        if emp_id:
            try:
                obj.employe = Employe.objects.get(id_employe=int(emp_id))
            except Employe.DoesNotExist:
                return JsonResponse({'error': 'Employé introuvable.'}, status=404)

        obj.save()
        return JsonResponse({'message': 'PC ancien attribué modifié avec succès'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


# Déclarer un matériel comme perdu (envoie un email avec les infos de l'utilisateur connecté)
def declarer_materiel_perdu(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)
    try:
        user_id = request.session.get('user_id')
        if not user_id:
            return JsonResponse({'error': 'Utilisateur non connecté.'}, status=401)
        try:
            employe = Employe.objects.get(id_employe=user_id)
        except Employe.DoesNotExist:
            return JsonResponse({'error': 'Employé non trouvé.'}, status=404)
        pc_attribue = None
        try:
            pc_attribue = Pc_attribué.objects.filter(employe=employe).first()
        except Exception:
            pc_attribue = None
        commentaires = request.POST.get('commentaires', '')
        date_perte = request.POST.get('date_perte') 

        objet = "Déclaration de matériel perdu"
        corps_message = f"""
Déclaration de matériel perdu

Employé : {employe.prenom} {employe.nom}
Fonction : {employe.fonction}
Département : {getattr(employe, 'Département', '')}
Matricule : {getattr(employe, 'matricule', '')}
Téléphone : {getattr(employe, 'telephone', '')}

Détails du matériel :
{('- Marque : ' + pc_attribue.marque) if pc_attribue else '- Aucun PC attribué trouvé'}
{('- Modèle : ' + pc_attribue.modele) if pc_attribue else ''}
{('- Numéro de série : ' + pc_attribue.numero_serie) if pc_attribue else ''}

Date de perte déclarée : {date_perte or 'Non précisée'}
Commentaires : {commentaires or 'N/A'}

Date de la déclaration : {datetime.now().strftime('%d/%m/%Y à %H:%M')}
        """.strip()

        # Enregistrer l'email dans la base de données
        
        Email_DOT.objects.create(
            destinataire="kaogeorges2006@gmail.com",
            objet=objet,
            corps=corps_message,
            expediteur=employe
        )
        Email_RDOT.objects.create(
            destinataire="kaogeorges2006@gmail.com",
            objet=objet,
            corps=corps_message,
            expediteur=employe
        )
        email = Email_DCH.objects.create(
            destinataire="kaogeorges2006@gmail.com",
            objet=objet,
            corps=corps_message,
            expediteur=employe
        )

        # Envoyer l'email réellement (non bloquant)
        email_envoye = False
        try:
            send_mail(
                subject=objet,
                message=corps_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=["kaogeorges2006@gmail.com"],
                fail_silently=False,
            )
            email_envoye = True
        except Exception as e:
            email_envoye = False

        return JsonResponse({
            'message': 'Déclaration de perte envoyée',
            'email_id': email.id_email,
            'email_sent': email_envoye
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)