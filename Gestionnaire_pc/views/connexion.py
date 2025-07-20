from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.urls import reverse
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
            return JsonResponse({'success': False, 'error': "Identifiant ou mot de passe incorrect."})
        except Exception as e:
            return JsonResponse({'success': False, 'error': f"Une erreur est survenue : {e}"})

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