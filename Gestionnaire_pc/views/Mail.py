from django.http import JsonResponse
import json
from django.core.mail import send_mail
from django.conf import settings
from ..models import Employe, Email, CaracteristiqueEnvoyee,Pc_attribué,Email_MGX, Email_DOT, Email_RDOT, Email_DAF


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

            subject = f'Nouvelle Demande de Caractéristique PC : {employe.prenom} {employe.nom}'
            if connected_user:
                subject = f'Nouvelle Demande de Caractéristique PC : {employe.prenom} {employe.nom} - Par {connected_user.prenom} {connected_user.nom}'

            message = f'Une nouvelle demande de caractéristique PC a été émise dans le système.\n\nInformations de la demande :\nEmployé concerné : {employe.prenom} {employe.nom}\nMatricule : {employe.matricule}\nDépartement : {employe.Département}\nFonction : {employe.fonction}\n\nObjet de la demande :\n{caracteristique}'
            
            if connected_user:
                message += f'\n\nDemande émise par :\nNom : {connected_user.nom}\nPrénom : {connected_user.prenom}\nFonction : {connected_user.fonction}\nDépartement : {connected_user.Département}'
            from_email = settings.EMAIL_HOST_USER  
            recipient_list = ['kaogeorges2006@gmail.com'] 

            try:
                send_mail(subject, message, from_email, recipient_list, fail_silently=False)
                email_status = "E-mail de notification envoyé avec succès."
                Email.objects.create(
                    objet=subject,
                    corps=message,
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
                    pass 
            subject = f'Nouvelles Caractéristiques PC Envoyées : {employe_concerne.prenom if employe_concerne else "Général"} {employe_concerne.nom if employe_concerne else ""}'
            if connected_user:
                subject = f'Nouvelles Caractéristiques PC Envoyées : {employe_concerne.prenom if employe_concerne else "Général"} {employe_concerne.nom if employe_concerne else ""} - Par {connected_user.prenom} {connected_user.nom}'

            message = f"De nouvelles caractéristiques PC ont été envoyées dans le système.\n\nCaractéristiques du PC :\nMarque : {marque}\nModèle : {modele}\nProcesseur : {processeur}\nRAM : {ram}\nDisque Dur : {disque}"

            if employe_concerne:
                message += f"\n\nEmployé concerné :\nNom : {employe_concerne.nom}\nPrénom : {employe_concerne.prenom}\nMatricule : {employe_concerne.matricule}\nDépartement : {employe_concerne.Département}\nFonction : {employe_concerne.fonction}"
            
            if connected_user:
                message += f"\n\nEnvoyé par :\nNom : {connected_user.nom}\nPrénom : {connected_user.prenom}\nFonction : {connected_user.fonction}\nDépartement : {connected_user.Département}"

            from_email = settings.EMAIL_HOST_USER
            recipient_list = ['kaogeorges2006@gmail.com'] 

            try:
                send_mail(subject, message, from_email, recipient_list, fail_silently=False)
                email_status = "E-mail de notification envoyé avec succès."

                Email.objects.create(
                    objet=subject,
                    corps=message,
                    destinataire=', '.join(recipient_list),
                    expediteur=connected_user,
                )
                Email_MGX.objects.create(
                    objet=subject,
                    corps=message,
                    destinataire=', '.join(recipient_list),
                    expediteur=connected_user,
                )

                caracteristique = CaracteristiqueEnvoyee.objects.create(
                    marque=marque,
                    modele=modele,
                    processeur=processeur,
                    ram=ram,
                    disque_dur=disque,
                    envoyeur=connected_user,
                    employe_concerne=employe_concerne, 
                )
            except Exception as e:
                email_status = f"Erreur lors de l'envoi de l'e-mail ou de la création: {e}"
            return JsonResponse({'message': f'Caractéristiques envoyées avec succès! {email_status}'})
        except Exception as e:
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

def get_notifications_dot(request):
    if request.method == 'GET':
        try:
            notifications = Email_DOT.objects.all().order_by('-date_envoi')[:10] 
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


def get_notifications_daf(request):
    if request.method == 'GET':
        try:
            notifications = Email_DAF.objects.all().order_by('-date_envoi')[:10] 
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

def get_notifications_mgx(request):
    if request.method == 'GET':
        try:
            notifications = Email_MGX.objects.all().order_by('-date_envoi')[:10] 
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


def get_notifications_rdot(request):
    if request.method == 'GET':
        try:
            notifications = Email_RDOT.objects.all().order_by('-date_envoi')[:10] 
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