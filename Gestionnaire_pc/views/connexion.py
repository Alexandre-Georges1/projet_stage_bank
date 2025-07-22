from django.shortcuts import render
from django.http import JsonResponse   
from django.urls import reverse
from django.contrib.auth import authenticate, login
from ..models import Employe

   
def connexion(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')  

        try:
            employe = Employe.objects.get(login=username, mot_de_passe=password)
            request.session['user_id'] = employe.pk

            response_data = {'success': True, 'user_fonction': employe.fonction}

            if employe.fonction in ['DOT', 'RDOT', 'DCH', 'MG', 'RMG', 'DAF']:
                response_data['choice_required'] = True
                response_data['user_role'] = employe.fonction
                response_data['specific_dashboard_url'] = reverse(f'dashboard_{employe.fonction}')
                response_data['general_dashboard_url'] = reverse('dashboard_employe')
            elif employe.fonction in ['Admin', 'admin']:
                response_data['redirect_url'] = reverse('custom_admin')
            elif employe.fonction in ['Employe', 'Utilisateur', 'Stagiaire', 'Autre']:
                response_data['redirect_url'] = reverse('dashboard_employe')
            else:
                response_data['success'] = False
                response_data['error'] = "Votre rôle n'est pas associé à une page spécifique."
            
            return JsonResponse(response_data)

        except Employe.DoesNotExist:
            user = authenticate(request, username=username, password=password)
            
            
            if user is not None:
                ldap_user = user.ldap_user
                nom = ldap_user.attrs.get('givenName', [''])[0]  # Nom de famille
                prenom = ldap_user.attrs.get('sn', [''])[0]  # Prénom
                login(request, user)
                response_data = {
                    'success': True,
                    'message': 'Authentifié via LDAP',
                    'nom': nom,
                    'prenom': prenom
                }
                if hasattr(user, 'is_mgx') and user.is_mgx:
                    user_role = 'MG'
                elif hasattr(user, 'is_dot') and user.is_dot:
                    user_role = 'DOT'
                elif hasattr(user, 'is_dch') and user.is_dch:
                    user_role = 'DCH'
                elif hasattr(user, 'is_rdot') and user.is_rdot:
                    user_role = 'RDOT'
                elif hasattr(user, 'is_rmg') and user.is_rmg:
                    user_role = 'RMG'
                elif hasattr(user, 'is_daf') and user.is_daf:   
                    user_role = 'DAF'
                elif hasattr(user, 'is_admin') and user.is_admin:
                    user_role = 'Admin'

                else:
                    user_role = 'Employe'
                try:
                    employe, created = Employe.objects.update_or_create(
                        login=username,
                        fonction=user_role,
                        mot_de_passe=password, 
                        nom=nom,
                        prenom=prenom,
                    )
                    request.session['user_id'] = employe.pk

                except Exception as e:
                    return JsonResponse({
                        'success': False,
                        'error': f"Erreur création compte: {str(e)}"
                    }, status=500)

                # Préparer la réponse
                response_data = {
                    'success': True,
                    'message': 'Authentifié via LDAP',
                    'user_role': user_role,
                    'user_fonction': user_role
                }

                if user_role in ['DOT', 'DCH', 'MG' , 'RDOT', 'RMG', 'DAF', 'Admin']:
                    response_data.update({
                        'choice_required': True,
                        'specific_dashboard_url': reverse(f'dashboard_{user_role}'),
                        'general_dashboard_url': reverse('dashboard_employe')
                    })
                else:
                    response_data['redirect_url'] = reverse('dashboard_employe')

                return JsonResponse(response_data)
            else:
                return JsonResponse({
                    'success': False, 
                    'error': "Identifiant ou mot de passe incorrect"
                })

        except Exception as e:
            return JsonResponse({
                'success': False, 
                'error': f"Erreur technique: {str(e)}"
            }, status=500)
    return render(request, 'page_de_connexion/connexion.html')


def deconnexion(request):
    if request.method == 'POST':
        try:
            del request.session['user_id']  
            return JsonResponse({'message': 'Déconnexion réussie!'})
        except KeyError:
            return JsonResponse({'error': 'Aucun utilisateur connecté.'}, status=400)
    return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)

def politique_confidentialite(request):
    return render(request, 'politique_confidentialité.html')