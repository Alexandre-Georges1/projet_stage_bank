from django.shortcuts import render
from django.http import JsonResponse
import json
from django.utils import timezone
from ..models import Employe, Bordereau

   
def envoyer_bordereau_employe(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            employe_id = data.get('employe_id')
            if not employe_id:
                return JsonResponse({'error': 'ID de l\'employé manquant.'}, status=400)

            employe = Employe.objects.get(pk=employe_id)

            Bordereau.objects.create(
                employe=employe,
                nom_employe=data.get('nom_employe'),
                prenom_employe=data.get('prenom_employe'),
                marque_pc=data.get('marque_pc'),
                modele_pc=data.get('modele_pc'),
                numero_serie_pc=data.get('numero_serie_pc'),
                description_pc=data.get('description_pc'),
                telephone_employe=data.get('telephone_employe'),
                email_employe=data.get('email_employe'),
            )
            return JsonResponse({'message': 'Bordereau envoyé avec succès!'})
        except Employe.DoesNotExist:
            return JsonResponse({'error': 'Employé non trouvé.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Méthode non autorisée.'}, status=405) 

   
def bordereau_utilisateur(request):
    employe_connecte = None
    if 'user_id' in request.session:
        try:
            employe_connecte = Employe.objects.get(pk=request.session['user_id'])
        except Employe.DoesNotExist:
            employe_connecte = None

    if employe_connecte:
        bordereaux = Bordereau.objects.filter(employe=employe_connecte)
    else:
        bordereaux = []

    return render(request, 'dashboard.html', {
        'bordereaux': bordereaux,
        'employe': employe_connecte
    })


def accepter_bordereau(request):
    if request.method == 'POST':
        try:
            # Récupérer l'employé connecté
            if 'user_id' not in request.session:
                return JsonResponse({'error': 'Utilisateur non connecté.'}, status=401)
            
            employe_connecte = Employe.objects.get(pk=request.session['user_id'])
            
            # Chercher le bordereau de cet employé (le plus récent)
            bordereau = Bordereau.objects.filter(employe=employe_connecte).order_by('-date_creation').first()
            
            if not bordereau:
                return JsonResponse({'error': 'Aucun bordereau trouvé pour cet employé.'}, status=404)
            
            # Mettre à jour le statut et la date
            bordereau.statut = 'lu et accepté'
            bordereau.date_statut = timezone.now()
            bordereau.save()
            
            # Formater la date pour l'affichage
            date_acceptation = bordereau.date_statut.strftime('%d/%m/%Y à %H:%M')
            
            return JsonResponse({
                'message': 'Bordereau accepté avec succès!',
                'date_acceptation': date_acceptation
            })
            
        except Employe.DoesNotExist:
            return JsonResponse({'error': 'Employé non trouvé.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)
