from django.http import JsonResponse
import json
from django.core.mail import send_mail
from django.conf import settings
from ..models import Employe, Email, Email_RDOT ,Email_DOT, Email_MGX 


def enregistrer_employe(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            employe = Employe.objects.create(
                nom=data.get('nom'),
                prenom=data.get('prenom'),
                matricule=data.get('matricule'),
                telephone=data.get('telephone'),
                Département=data.get('departement'),
                date_embauche=data.get('dateEmbauche'),
                fonction=data.get('fonction')
            )
            subject = f'Nouvel Employé Enregistré : {employe.prenom} {employe.nom}'
            message = f'Un nouvel employé a été enregistré dans le système.\n\nCaractéristiques de l\'employé :\nNom : {employe.nom}\nPrénom : {employe.prenom}\nMatricule : {employe.matricule}\nTéléphone : {employe.telephone}\nDépartement : {employe.Département}\nDate d\'embauche : {employe.date_embauche}\nfonction : {employe.fonction}'
            from_email = settings.EMAIL_HOST_USER
            recipient_list = ['kaogeorges2006@gmail.com'] 

            try:
                send_mail(subject, message, from_email, recipient_list, fail_silently=False)
                email_status = "E-mail de notification envoyé avec succès."
                Email.objects.create(
                objet=subject,
                corps=message,
                destinataire=', '.join(recipient_list), 
                expediteur=None, 
            )
                Email_DOT.objects.create(
                    objet=subject,
                    corps=message,
                    destinataire=', '.join(recipient_list),
                    expediteur=None,
                )
                Email_RDOT.objects.create(
                    objet=subject,
                    corps=message,
                    destinataire=', '.join(recipient_list),
                    expediteur=None,
                )
                Email_MGX.objects.create(
                    objet=subject,
                    corps=message,
                    destinataire=', '.join(recipient_list),
                    expediteur=None,
                )
            except Exception as e:
                email_status = f"Erreur lors de l\'envoi de l\'e-mail : {e}"
                print(email_status) 
                
            return JsonResponse({'message': f'Nouvel employé enregistré avec succès! {email_status}', 'id': employe.pk})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)
