from django.http import JsonResponse
from ..models import Pc_attribué, Employe, Email, Email_RDOT, Email_DAF, Email_MGX
from django.core.mail import send_mail
from django.conf import settings

def racheter_pc(request):
    user_id = request.session.get('user_id')
    if not user_id:
        return JsonResponse({'error': 'Utilisateur non connecté.'}, status=401)
    try:
        employe = Employe.objects.get(pk=user_id)
        pc = Pc_attribué.objects.get(employe=employe)

        pc_info = {
            'marque': pc.marque,
            'modele': pc.modele,
            'numero_serie': pc.numero_serie,
            'processeur': pc.processeur,
            'ram': pc.ram,
            'disque_dur': pc.disque_dur,
            'date_achat': pc.date_achat,
            'date_attribution': pc.date_attribution,
            'status': pc.status 
        }
        return JsonResponse({'pc_info': pc_info})
    except Employe.DoesNotExist:
        return JsonResponse({'error': 'Employé introuvable.'}, status=404)
    except Pc_attribué.DoesNotExist:
        return JsonResponse({'message': 'Aucun PC attribué à cet employé.'}, status=200)
    

   
def demande_de_rachat(request):
    if request.method == 'POST':
        try:
            connected_user = None
            pc = None
            if 'user_id' in request.session:
                try:
                    connected_user = Employe.objects.get(pk=request.session['user_id'])
                    pc = Pc_attribué.objects.get(employe=connected_user)
                except Employe.DoesNotExist:
                    connected_user = None
                except Pc_attribué.DoesNotExist:
                    pc = None

            if not connected_user or not pc:
                return JsonResponse({'error': "Impossible de retrouver l'utilisateur ou son PC attribué."}, status=400)
            nom = connected_user.nom
            prenom = connected_user.prenom
            telephone = connected_user.telephone
            marque = pc.marque
            modele = pc.modele
            numero_serie = pc.numero_serie
            date_achat = pc.date_achat

            sender_info = f' par {prenom} {nom} ({connected_user.fonction})'
            subject = f"Demande de rachat de PC par {nom} {prenom}"
            message = (
                f"Une demande de rachat de PC a été soumise{sender_info}.\n\n"
                f"Détails de l'utilisateur :\n"
                f"Nom : {nom}\n"
                f"Prénom : {prenom}\n"
                f"Téléphone : {telephone}\n"
                f"PC : {marque} {modele}\n"
                f"Numéro de série : {numero_serie}\n"
                f"Date d'achat : {date_achat}"
            )

            email_status = ""

            # Envoi de l’e-mail
            try:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    ['kaogeorges2006@gmail.com'],
                    fail_silently=False
                )
                email_status = "E-mail envoyé avec succès."
            except Exception as e:
                email_status = f"Erreur lors de l'envoi de l’e-mail : {e}"

            Email.objects.create(
                objet=subject,
                destinataire='kaogeorges2006@gmail.com',
                corps=message,
                expediteur=connected_user
            ) 
            Email_RDOT.objects.create(
                objet=subject,
                corps=message,
                destinataire='kaogeorges2006@gmail.com',
                expediteur=connected_user,
            )
            Email_DAF.objects.create(
                objet=subject,
                corps=message,
                destinataire='kaogeorges2006@gmail.com',
                expediteur=connected_user,
            )
            Email_MGX.objects.create(
                objet=subject,
                corps=message,
                destinataire='kaogeorges2006@gmail.com',
                expediteur=connected_user,
            )
            try:
                if connected_user:
                    pc = Pc_attribué.objects.get(employe=connected_user)
                    pc.status = "en attente"
                    pc.save()
                else:
                    email_status += "Aucun utilisateur connecté pour mise à jour du statut du PC."
            except Pc_attribué.DoesNotExist:
                email_status += "Aucun PC attribué trouvé pour cet utilisateur pour mise à jour du statut."

            return JsonResponse({'message': f'Demande envoyée avec succès ! {email_status}'})
        
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)
