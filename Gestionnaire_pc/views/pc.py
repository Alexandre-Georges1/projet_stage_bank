from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from django.core.mail import send_mail
from django.conf import settings
import json
from ..models import Employe,PC,Pc_attribué,marquePC,modelePC,Email,DemandeAchatPeripherique
from datetime import datetime

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

            pc = PC.objects.create(
                marque=marque_instance,
                modele=modele_instance,
                processeur=data.get('processeur'),
                ram=data.get('ram'),
                disque_dur=data.get('disque'),
                numero_serie=data.get('serial'),
                date_achat=data.get('dateAchat')
            )
            return JsonResponse({'message': 'PC ajouté avec succès!', 'id': pc.pk})
        except Exception as e:
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

            # Traitement de la marque
            marque_name = data.get('marque')
            if marque_name:
                marque_instance, created = marquePC.objects.get_or_create(nom_marque=marque_name)
                pc.marque = marque_instance

            # Traitement du modèle
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
                disque_dur=pc.disque_dur, # Assurez-vous que le disque dur est également inclus ici
                processeur=pc.processeur, # Inclure le processeur
                numero_serie=pc.numero_serie, # Ajout du numéro de série
                date_achat=pc.date_achat, # Inclure la date d'achat
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

from django.views.decorators.csrf import csrf_exempt
    
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



def restituer_pc(request):
    if request.method == 'POST':
        try:
            motif = request.POST.get('motif')
            autre_motif = request.POST.get('autre_motif', '')
            date_restitution = request.POST.get('date_restitution')
            commentaires = request.POST.get('commentaires', '')

            # Debug : afficher les données reçues
            print(f"🔍 DEBUG - Données reçues:")
            print(f"  motif: {motif}")
            print(f"  autre_motif: {autre_motif}")
            print(f"  date_restitution: {date_restitution}")

            user_id = request.session.get('user_id')
            print(f"  user_id de session: {user_id}")
            
            if not user_id:
                return JsonResponse({'error': 'Utilisateur non connecté.'}, status=401)
            
            try:
                employe = Employe.objects.get(id_employe=user_id)
                print(f"  Employé trouvé: {employe.prenom} {employe.nom} (ID: {employe.id_employe})")
            except Employe.DoesNotExist:
                print(f"  ❌ Employé non trouvé pour user_id: {user_id}")
                return JsonResponse({'error': 'Employé non trouvé.'}, status=404)

            # Rechercher le PC attribué à cet employé (sans dépendre du pc_id du formulaire)
            try:
                pc_attribue = Pc_attribué.objects.get(employe=employe)
                print(f"  ✅ PC attribué trouvé: {pc_attribue.marque} {pc_attribue.modele} (ID: {pc_attribue.id_attribue})")
            except Pc_attribué.DoesNotExist:
                print(f"  ❌ Aucun PC attribué trouvé pour l'employé {employe.id_employe} ({employe.nom})")
                return JsonResponse({'error': 'Aucun PC attribué trouvé pour cet employé.'}, status=404)
            except Pc_attribué.MultipleObjectsReturned:
                print(f"  ⚠️ Plusieurs PCs attribués trouvés pour l'employé {employe.id_employe}")
                # Prendre le premier PC trouvé
                pc_attribue = Pc_attribué.objects.filter(employe=employe).first()
                print(f"  📌 PC sélectionné: {pc_attribue.marque} {pc_attribue.modele}")

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



@csrf_exempt
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