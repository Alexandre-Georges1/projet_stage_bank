from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from ..models import DemandeAchatPeripherique, Employe
import json

@csrf_exempt
def gerer_demandes_achat(request):
    """Vue pour gérer les demandes d'achat de périphériques (pour les administrateurs)"""
    if request.method == 'GET':
        # Récupérer toutes les demandes de périphériques
        demandes_en_attente = DemandeAchatPeripherique.objects.filter(statut="en_attente").order_by('-date_demande')
        demandes_traitees = DemandeAchatPeripherique.objects.filter(statut__in=["approuve", "refuse"]).order_by('-date_demande')
        
        context = {
            'demandes_peripheriques_en_attente': demandes_en_attente,
            'demandes_peripheriques_traitees': demandes_traitees
        }
        return render(request, 'dashboard.html', context)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            demande_id = data.get('demande_id')
            nouveau_statut = data.get('statut')
            
            # Récupérer l'utilisateur connecté
            connected_user_id = request.session.get('user_id')
            if not connected_user_id:
                return JsonResponse({'error': 'Utilisateur non connecté.'}, status=401)
            
            try:
                connected_user = Employe.objects.get(id_employe=connected_user_id)
            except Employe.DoesNotExist:
                return JsonResponse({'error': 'Employé non trouvé.'}, status=404)
            
            # Mettre à jour la demande d'achat de périphérique
            try:
                demande = DemandeAchatPeripherique.objects.get(id_demande=demande_id)
                demande.statut = nouveau_statut
                demande.traite_par = connected_user
                demande.save()
                
                return JsonResponse({
                    'message': f'Demande mise à jour avec succès: {demande.get_statut_display()}',
                    'nouveau_statut': demande.get_statut_display()
                })
                
            except DemandeAchatPeripherique.DoesNotExist:
                return JsonResponse({'error': 'Demande non trouvée.'}, status=404)
            
        except Exception as e:
            return JsonResponse({'error': f'Erreur lors de la mise à jour: {str(e)}'}, status=400)
    
    return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)
