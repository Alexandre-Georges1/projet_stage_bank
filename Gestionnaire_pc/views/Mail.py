from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail
from django.conf import settings
from ..models import Employe, Email, CaracteristiqueEnvoyee,Pc_attribué
from django.core import serializers # Ajout de serializers

   
def demander_caracteristique(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            employe_id = data.get('employe_id')
            caracteristique = data.get('caracteristique')

            employe = Employe.objects.get(pk=employe_id)
            
            connected_user = None
            if 'user_id' in request.session:
                try:
                    connected_user = Employe.objects.get(pk=request.session['user_id'])
                except Employe.DoesNotExist:
                    pass 
                
            sender_info = ""
            if connected_user:
                sender_info = f' par {connected_user.prenom} {connected_user.nom} ({connected_user.fonction})'

            subject = "Demande de caractéristique PC"
            if connected_user:
                subject = f"Demande de caractéristique PC par {connected_user.prenom} {connected_user.nom} ({connected_user.fonction})"

            message = f'Une demande de caractéristique PC a été émise pour l\'employé {employe.prenom} {employe.nom}{sender_info}.\n\nObjet de la demande : {caracteristique}'
            from_email = settings.EMAIL_HOST_USER  
            recipient_list = ['kaogeorges2006@gmail.com'] 

            try:
                send_mail(subject, message, from_email, recipient_list, fail_silently=False)
                email_status = "E-mail de notification envoyé avec succès."
                Email.objects.create(
                    objet=subject,
                    destinataire=', '.join(recipient_list), 
                    expediteur=connected_user, 
                )
          
            except Exception as e:
                email_status = f"Erreur lors de l\'envoi de l\'e-mail : {e}"
                print(email_status) 

            return JsonResponse({'message': f'Demande envoyée avec succès! {email_status}'})
        except Employe.DoesNotExist:
            return JsonResponse({'error': 'Employé non trouvé.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)


   
def envoyer_caracteristiques(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            marque = data.get('marque')
            modele = data.get('model')
            processeur = data.get('processeur')
            ram = data.get('ram')
            disque = data.get('disque')
            employe_concerne_id = data.get('employe_concerne') 

            print(f"[DEBUG] Données reçues: {data}")

            employe_concerne = None
            if employe_concerne_id:
                try:
                    employe_concerne = Employe.objects.get(pk=employe_concerne_id)
                except Exception as e:
                    print(f"[DEBUG] Erreur lors de la récupération de l'employé concerné: {e}")

            connected_user = None
            if 'user_id' in request.session:
                try:
                    connected_user = Employe.objects.get(pk=request.session['user_id'])
                except Employe.DoesNotExist:
                    print("[DEBUG] Utilisateur connecté introuvable dans la session.")
                    pass 

            print(f"[DEBUG] employe_concerne: {employe_concerne}")
            print(f"[DEBUG] connected_user: {connected_user}")

            subject = "Envoi de Caractéristiques PC"
            if connected_user:
                subject = f"Envoi de Caractéristiques PC par {connected_user.prenom} {connected_user.nom} ({connected_user.fonction})"

            message = f"Les caractéristiques de PC suivantes ont été envoyées :\n\n"
            message += f"Marque : {marque}\n"
            message += f"Modèle : {modele}\n"
            message += f"Processeur : {processeur}\n"
            message += f"RAM : {ram}\n"
            message += f"Disque Dur : {disque}\n"

            if employe_concerne:
                message += f"\nPour l'employé : {employe_concerne.prenom} {employe_concerne.nom}"
            
            if connected_user:
                message += f"\nEnvoyé par : {connected_user.prenom} {connected_user.nom} ({connected_user.fonction})"

            from_email = settings.EMAIL_HOST_USER
            recipient_list = ['kaogeorges2006@gmail.com'] 

            try:
                send_mail(subject, message, from_email, recipient_list, fail_silently=False)
                email_status = "E-mail de notification envoyé avec succès."

                Email.objects.create(
                    objet=subject,
                    destinataire=', '.join(recipient_list),
                    expediteur=connected_user,
                )

                print("[DEBUG] Avant création CaracteristiqueEnvoyee")
                caracteristique = CaracteristiqueEnvoyee.objects.create(
                    marque=marque,
                    modele=modele,
                    processeur=processeur,
                    ram=ram,
                    disque_dur=disque,
                    envoyeur=connected_user,
                    employe_concerne=employe_concerne, 
                )
                print(f"[DEBUG] CaracteristiqueEnvoyee créée: {caracteristique}")

            except Exception as e:
                email_status = f"Erreur lors de l'envoi de l'e-mail ou de la création: {e}"
                print(email_status) 

            return JsonResponse({'message': f'Caractéristiques envoyées avec succès! {email_status}'})
        except Exception as e:
            print(f"[DEBUG] Exception globale: {e}")
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)

   
def get_notifications(request):
    if request.method == 'GET':
        try:
            # Récupérer les 10 dernières notifications (emails) par exemple
            notifications = Email.objects.all().order_by('-date_envoi')[:10] 
            notifications_data = []
            for email in notifications:
                notification_type = 'info'
                if 'erreur' in email.objet.lower() or 'error' in email.objet.lower():
                    notification_type = 'error'
                elif 'succès' in email.objet.lower() or 'success' in email.objet.lower():
                    notification_type = 'success'
                elif 'demande' in email.objet.lower():
                    notification_type = 'info'
                elif 'caractéristiques' in email.objet.lower():
                    notification_type = 'success'
                
                formatted_time = email.date_envoi.strftime("%Y-%m-%d %H:%M:%S")

                sender_name = email.expediteur.nom if email.expediteur else 'Inconnu'
                sender_email = email.expediteur.email if email.expediteur else ''

                notifications_data.append({
                    'id': email.id_email,
                    'type': notification_type,
                    'message': email.objet,
                    'time': formatted_time,
                    'sender_name': sender_name,
                    'sender_email': sender_email,
                    'read': email.is_read 
                })
            
            return JsonResponse(notifications_data, safe=False)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)

   
def mark_notification_as_read(request, email_id):
    if request.method == 'POST':
        try:
            email = Email.objects.get(pk=email_id)
            email.is_read = True
            email.save()
            return JsonResponse({'message': 'Notification marquée comme lue.'})
        except Email.DoesNotExist:
            return JsonResponse({'error': 'Notification non trouvée.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)

   
def valider_ou_refuser_pc(request):
    if request.method == 'POST':
        try:  
            data = json.loads(request.body)
            pc_id = data.get('pc_id')
            action = data.get('action')  
            fonction = data.get('fonction')      

            pc = Pc_attribué.objects.get(pk=pc_id)

            if action == 'refuser':
                pc.status = 'refusé'
                pc.validation_rmg = 'refusé'
                pc.validation_daf = 'refusé'
                pc.save()
                return JsonResponse({'status': 'refusé'})

            if action == 'valider':
                if fonction == 'RMG':
                    pc.validation_rmg = 'validé'
                elif fonction == 'DAF':
                    pc.validation_daf = 'validé'
                if pc.validation_rmg == 'validé' and pc.validation_daf == 'validé':
                    pc.status = 'validé'
                else:
                    pc.status = 'en attente'
                pc.save()
                return JsonResponse({'status': pc.status, 'validation_rmg': pc.validation_rmg, 'validation_daf': pc.validation_daf})

            return JsonResponse({'error': 'Action inconnue.'}, status=400)
        except Pc_attribué.DoesNotExist:
            return JsonResponse({'error': 'PC attribué non trouvé.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)