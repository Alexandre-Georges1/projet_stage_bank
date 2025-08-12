from django.http import JsonResponse    
from django.utils import timezone
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
import json
from ..models import Employe,PC,Pc_attribué,Pc_ancien,marquePC,modelePC,Email,DemandeAchatPeripherique, Pc_ancien_attribue
from datetime import datetime, timedelta

  
def ajouter_pc(request):
    if request.method == 'POST':
        try:
            print(f"[DEBUG] Request content type: {request.content_type}")
            print(f"[DEBUG] Request body: {request.body}")
            
            data = json.loads(request.body)
            print(f"[DEBUG] Parsed data: {data}")

            marque_name = data.get('marque')
            print(f"[DEBUG] Marque: '{marque_name}'")
            if not marque_name:
                return JsonResponse({'error': 'Marque manquante.'}, status=400)
            marque_instance, created = marquePC.objects.get_or_create(nom_marque=marque_name)

            modele_name = data.get('model')
            print(f"[DEBUG] Modele: '{modele_name}'")
            if not modele_name:
                return JsonResponse({'error': 'Modèle manquant.'}, status=400)
            modele_instance, created = modelePC.objects.get_or_create(nom_modele=modele_name)

            processeur = data.get('processeur')
            ram = data.get('ram')
            disque_dur = data.get('disque')
            numero_serie = data.get('serial')
            date_achat = data.get('dateAchat')
            
            print(f"[DEBUG] Autres champs - Processeur: '{processeur}', RAM: '{ram}', Disque: '{disque_dur}', Serial: '{numero_serie}', Date: '{date_achat}'")

            pc = PC.objects.create(
                marque=marque_instance,
                modele=modele_instance,
                processeur=processeur,
                ram=ram,
                disque_dur=disque_dur,
                numero_serie=numero_serie,
                date_achat=date_achat
            )
            print(f"[DEBUG] PC créé avec succès: {pc.pk}")
            return JsonResponse({'message': 'PC ajouté avec succès!', 'id': pc.pk})
        except Exception as e:
            print(f"[ERROR] Exception in ajouter_pc: {e}")
            print(f"[ERROR] Exception type: {type(e)}")
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
            data = json.loads(request.body)
            employe_id = data.get('employe_id')
            date_attribution_str = data.get('date_attribution')
            numero_serie = data.get('numero_serie')

            try:
                employe = Employe.objects.get(id_employe=employe_id)
            except Employe.DoesNotExist:
                return JsonResponse({'error': 'Employé non trouvé.'}, status=404)
            try:
                pc = PC.objects.get(numero_serie=numero_serie)
            except PC.DoesNotExist:
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

    elif request.method == 'DELETE':
        data = json.loads(request.body)
        nom = data.get('nom')
        marque = marquePC.objects.filter(nom_marque=nom).first()
        if marque:
            marque.delete()
            return JsonResponse({'message': 'Marque supprimée.'})
        return JsonResponse({'error': 'Marque introuvable'}, status=404)


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

        pc_a.employe = employe
        pc_a.save(update_fields=['employe'])

        # Créer un enregistrement d'attribution dédié
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

        Pc_ancien_attribue.objects.create(
            pc_ancien=pc_a,
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
            print(f"  user_id de session: {user_id}")
            
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
            email = Email.objects.create(
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
            email = Email.objects.create(
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