from django.http import JsonResponse
from django.utils import timezone
from ..models import Bordereau
import json

def marquer_bordereau_lu_accepte(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            bordereau_id = data.get('bordereau_id')
            if not bordereau_id:
                return JsonResponse({'error': "ID du bordereau manquant."}, status=400)
            bordereau = Bordereau.objects.get(pk=bordereau_id)
            bordereau.statut = "accepté"
            bordereau.date_statut = timezone.now()
            bordereau.save()
            return JsonResponse({
                'message': 'Bordereau marqué comme lu et accepté.',
                'statut': bordereau.statut,
                'date_statut': bordereau.date_statut
            })
        except Bordereau.DoesNotExist:
            return JsonResponse({'error': 'Bordereau non trouvé.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)
