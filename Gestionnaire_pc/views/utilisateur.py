from django.http import JsonResponse
import json
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.hashers import make_password
from ..models import Employe,Email,Email_DOT, Email_MGX, Email_RDOT
def ajouter_utilisateur(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            employe = Employe.objects.create(
                nom=data.get('nom'),
                prenom=data.get('prenom'),
                login=data.get('login'),
                mot_de_passe=make_password(data.get('password')),
                matricule=data.get('matricule'),
                telephone=data.get('telephone'),
                Département=data.get('departement'),
                date_embauche=data.get('dateEmbauche'),
                fonction=data.get('fonction'),
                email=data.get('email') or 'employe@gmail.com'
            )

            subject = f'Nouvel Employé Ajouté : {employe.prenom} {employe.nom}'
            message = f'Un nouvel employé a été ajouté au système.\n\nCaractéristiques de l\'employé :\nNom : {employe.nom}\nPrénom : {employe.prenom}\nLogin : {employe.login}\nMatricule : {employe.matricule}\nTéléphone : {employe.telephone}\nDépartement : {employe.Département}\nDate d\'embauche : {employe.date_embauche}\nfonction : {employe.fonction}'
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

            return JsonResponse({'message': f'Utilisateur ajouté avec succès! {email_status}', 'id': employe.pk})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)

def supprimer_utilisateur(request, user_id):
    if request.method == 'POST':
        try:
            employe = Employe.objects.get(pk=user_id)
            employe.delete()
            return JsonResponse({'message': 'Utilisateur supprimé avec succès!'})
        except Employe.DoesNotExist:
            return JsonResponse({'error': 'Utilisateur non trouvé.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)

def modifier_utilisateur(request, user_id):
    if request.method == 'POST':
        try:
            employe = Employe.objects.get(pk=user_id)
            data = json.loads(request.body)

            employe.nom = data.get('nom', employe.nom)
            employe.prenom = data.get('prenom', employe.prenom)
            employe.login = data.get('login', employe.login)
            
            if 'password' in data and data['password']:
                employe.mot_de_passe = make_password(data['password'])
                
            employe.matricule = data.get('matricule', employe.matricule)
            employe.telephone = data.get('telephone', employe.telephone)
            employe.Département = data.get('departement', employe.Département)
            employe.date_embauche = data.get('dateEmbauche', employe.date_embauche)
            employe.fonction = data.get('fonction', employe.fonction)
            if 'email' in data:
                employe.email = data.get('email') or employe.email
            
            employe.save()
            return JsonResponse({'message': 'Utilisateur modifié avec succès!'})
        except Employe.DoesNotExist:
            return JsonResponse({'error': 'Utilisateur non trouvé.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)
