from django.shortcuts import render
from django.http import JsonResponse
from django.core.mail import send_mail
from django.conf import settings
from ..models import DemandeAchatPeripherique, Employe, Email_MGX
import json

  
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

                email_sent = False
                email_id = None
                # Si la demande est approuvée, notifier par email la nécessité d'achat
                if (nouveau_statut or '').lower() == 'approuve':
                    try:
                        employe = demande.employe
                        objet = f"Validation d'achat de périphérique - {employe.nom} {employe.prenom} - {demande.materiel}"
                        corps_message = f"""
Une demande d'achat de périphérique a été approuvée par le responsable exploitation et infrastructure {connected_user.prenom} {connected_user.nom}.
Détails de la demande:
- Employé: {employe.prenom} {employe.nom}
- Département: {getattr(employe, 'Département', '')}
- Matricule: {getattr(employe, 'matricule', '')}
- Téléphone: {getattr(employe, 'telephone', '')}
- Objet: {demande.objet_demande}
- Matériel: {demande.materiel}
- Commentaires: {demande.commentaires or 'N/A'}
- Numéro de demande: {demande.id_demande}

Approuvée par: {connected_user.prenom} {connected_user.nom}
                        """.strip()

                        # Enregistrer l'email
                        email = Email_MGX.objects.create(
                            destinataire="kaogeorges2006@gmail.com",
                            objet=objet,
                            corps=corps_message,
                            expediteur=connected_user
                        )
                        email_id = email.id_email
                        # Envoyer l'email réellement
                        try:
                            send_mail(
                                subject=objet,
                                message=corps_message,
                                from_email=settings.DEFAULT_FROM_EMAIL,
                                recipient_list=["kaogeorges2006@gmail.com"],
                                fail_silently=False,
                            )
                            email_sent = True
                        except Exception:
                            email_sent = False
                    except Exception:
                        email_sent = False

                return JsonResponse({
                    'message': f'Demande approuvée avec succès: {demande.get_statut_display()}',
                    'nouveau_statut': demande.get_statut_display(),
                    'email_sent': email_sent,
                    'email_id': email_id,
                })
                
            except DemandeAchatPeripherique.DoesNotExist:
                return JsonResponse({'error': 'Demande non trouvée.'}, status=404)
            
        except Exception as e:
            return JsonResponse({'error': f'Erreur lors de la mise à jour: {str(e)}'}, status=400)
    
    return JsonResponse({'error': 'Méthode non autorisée.'}, status=405)
