from django.shortcuts import render, redirect
from ..models import Employe,PC,CaracteristiqueEnvoyee, Pc_attribué, Pc_ancien, marquePC, modelePC, Email,Bordereau,DemandeAchatPeripherique, Email_DOT, Email_DAF, Email_MGX, Email_RDOT, Pc_ancien_attribue
from django.contrib.auth.decorators import login_required


def get_demandes_peripheriques():
    """Helper function pour récupérer les demandes de périphériques"""
    demandes_en_attente = DemandeAchatPeripherique.objects.filter(statut="en_attente").order_by('-date_demande')
    demandes_traitees = DemandeAchatPeripherique.objects.filter(statut__in=["approuve", "refuse"]).order_by('-date_demande')
    return demandes_en_attente, demandes_traitees

def get_user_demandes_achat(user_id):
    """Helper function pour récupérer les demandes d'achat d'un utilisateur"""
    demandes_achat = []
    if user_id:
        try:
            employe = Employe.objects.get(pk=user_id)
            demandes_achat = DemandeAchatPeripherique.objects.filter(
                employe=employe
            ).order_by('-date_demande')
        except Employe.DoesNotExist:
            pass
    return demandes_achat

def dashboard(request):
    employes = Employe.objects.all()
    pcs = PC.objects.all()
    caracteristiques_envoyees = CaracteristiqueEnvoyee.objects.all().order_by('-date_envoi') 
    pcs_anciens = Pc_ancien.objects.all().order_by('-date_ajout')
    pcs_attribues = Pc_attribué.objects.all().order_by('-date_attribution')  
    pcs_anciens_attribues = Pc_ancien_attribue.objects.select_related('employe').order_by('-date_attribution')
    pc_total = PC.objects.count()  
    pc_en_service = Pc_attribué.objects.count()
    pc_en_rebu = Pc_ancien.objects.count()
    marques = marquePC.objects.all()
    modeles = modelePC.objects.all()
    emails = Email.objects.all()
    connected_user = None
    demandes_achat = []
    demandes_peripheriques_en_attente, demandes_peripheriques_traitees = get_demandes_peripheriques()
    
    if 'user_id' in request.session:
        try:
            connected_user = Employe.objects.get(pk=request.session['user_id'])
            # Récupérer les demandes d'achat de périphériques de l'utilisateur connecté
            demandes_achat = DemandeAchatPeripherique.objects.filter(
                employe=connected_user
            ).order_by('-date_demande')
            
            for pc in pcs_attribues:
                print(f"DEBUG - PC: {pc.marque} {pc.modele} attribué à employé ID: {pc.employe.id_employe} ({pc.employe.nom} {pc.employe.prenom})")
                if pc.employe.id_employe == connected_user.id_employe:
                    print(f"DEBUG - *** CORRESPONDANCE TROUVÉE! ***")
        except Employe.DoesNotExist:
            del request.session['user_id']

    context = {
        'employes': employes,
        'pcs': pcs,
        'caracteristiques_envoyees': caracteristiques_envoyees,
        'pcs_anciens': pcs_anciens,
    'pcs_attribues': pcs_attribues,  
    'pcs_anciens_attribues': pcs_anciens_attribues,
        'pc_total':pc_total,
        'pc_en_service': pc_en_service,
        'pc_en_rebu': pc_en_rebu,
        'marques': marques,
        'modeles': modeles,
        'notifications': emails,
        'connected_user':connected_user,
        'demandes_achat': demandes_achat,
        'demandes_peripheriques_en_attente': demandes_peripheriques_en_attente,
        'demandes_peripheriques_traitees': demandes_peripheriques_traitees
    }
    return render(request, 'dashboard.html',context)


def dashboard_employe(request):
    employes = Employe.objects.all()
    pcs = PC.objects.all()
    caracteristiques_envoyees = CaracteristiqueEnvoyee.objects.all().order_by('-date_envoi')
    connected_user = None
    employe = None
    bordereaux = []
    demandes_achat = []
    if 'user_id' in request.session:
        try:
            employe = Employe.objects.get(pk=request.session['user_id'])
            connected_user = employe
            bordereaux = Bordereau.objects.filter(employe=employe)
            # Utiliser la fonction helper pour récupérer les demandes
            demandes_achat = get_user_demandes_achat(request.session['user_id'])
        except Employe.DoesNotExist:
            del request.session['user_id']

    context = {
        'employes': employes,
        'pcs': pcs,
        'connected_user': connected_user,
        'caracteristiques_envoyees': caracteristiques_envoyees,
        'employe': employe,
        'bordereaux': bordereaux,
        'demandes_achat': demandes_achat
    }
    return render(request, 'page_employe/dashboard_employé.html', context)


def dashboard_DCH(request):
    employes = Employe.objects.all()
    pcs = PC.objects.all()
    caracteristiques_envoyees = CaracteristiqueEnvoyee.objects.all().order_by('-date_envoi')
    pcs_attribues = Pc_attribué.objects.all().order_by('-date_attribution')

    connected_user = None
    if 'user_id' in request.session:
        try:
            connected_user = Employe.objects.get(pk=request.session['user_id'])
        except Employe.DoesNotExist:
            del request.session['user_id']
            return redirect('connexion')
    if not connected_user or connected_user.fonction != 'DCH':
        return redirect('connexion') 

    context = {'employes': employes,
                'pcs': pcs,
                  'connected_user': connected_user,
                    'caracteristiques_envoyees': caracteristiques_envoyees,
                      'pcs_attribues': pcs_attribues,
                      
                      }
    return render(request, 'page_DCH/dashboard_DCH.html', context)


def dashboard_MG(request):
    employes = Employe.objects.all()
    pcs = PC.objects.all()
    caracteristiques_envoyees = CaracteristiqueEnvoyee.objects.all().order_by('-date_envoi')
    pcs_attribues = Pc_attribué.objects.all().order_by('-date_attribution')
    emails = Email_MGX.objects.all()
    connected_user = None
    if 'user_id' in request.session:
        try:
            connected_user = Employe.objects.get(pk=request.session['user_id'])
        except Employe.DoesNotExist:
            del request.session['user_id']
            return redirect('connexion')
    if not connected_user or connected_user.fonction != 'MG':
        return redirect('connexion') 

    context = {
        'employes': employes, 
        'pcs': pcs, 
        'connected_user': connected_user,
        'caracteristiques_envoyees': caracteristiques_envoyees, 
        'pcs_attribues': pcs_attribues,
        'notifications': emails
          }
    return render(request, 'page_MGX/dashboard_MG.html', context)


 
def dashboard_RMG(request):
    employes = Employe.objects.all()
    pcs = PC.objects.all()
    caracteristiques_envoyees = CaracteristiqueEnvoyee.objects.all().order_by('-date_envoi')
    pcs_attribues = Pc_attribué.objects.all().order_by('-date_attribution')
    
    connected_user = None
    if 'user_id' in request.session:
        try:
            connected_user = Employe.objects.get(pk=request.session['user_id'])
        except Employe.DoesNotExist:
            del request.session['user_id']
            return redirect('connexion')
    if not connected_user or connected_user.fonction != 'RMG':
        return redirect('connexion') 

    context = {'employes': employes, 'pcs': pcs, 'connected_user': connected_user, 'caracteristiques_envoyees': caracteristiques_envoyees, 'pcs_attribues': pcs_attribues}
    return render(request, 'page_MGX/dashboard_RMG.html', context)


def dashboard_DAF(request):
    employes = Employe.objects.all()
    pcs = PC.objects.all()
    caracteristiques_envoyees = CaracteristiqueEnvoyee.objects.all().order_by('-date_envoi')
    pcs_attribues = Pc_attribué.objects.all().order_by('-date_attribution')
    emails = Email_DAF.objects.all()
    connected_user = None
    if 'user_id' in request.session:
        try:
            connected_user = Employe.objects.get(pk=request.session['user_id'])
        except Employe.DoesNotExist:
            del request.session['user_id']
            return redirect('connexion')
    if not connected_user or connected_user.fonction != 'DAF':
        return redirect('connexion') 

    context = {
        'employes': employes, 
        'pcs': pcs,
        'connected_user': connected_user, 
        'caracteristiques_envoyees': caracteristiques_envoyees, 
        'pcs_attribues': pcs_attribues}
    return render(request, 'page_DAF/dashboard_DAF.html', context)


def dashboard_RDOT(request):
    employes = Employe.objects.all()
    pcs = PC.objects.all()
    caracteristiques_envoyees = CaracteristiqueEnvoyee.objects.all().order_by('-date_envoi')
    pcs_attribues = Pc_attribué.objects.all().order_by('-date_attribution')
    pc_en_service= Pc_attribué.objects.count()
    pc_total = PC.objects.count()
    pcs_anciens_attribues = Pc_ancien_attribue.objects.select_related('employe').order_by('-date_attribution')
    pc_en_rebu = Pc_ancien.objects.count()
    pc_en_rebu_attribue = Pc_ancien_attribue.objects.count()
    pc_total_global=pc_total + pc_en_rebu + pc_en_rebu_attribue + pc_en_service
    emails = Email_RDOT.objects.all()
    marques=marquePC.objects.all()
    modeles=modelePC.objects.all()
    pcs_anciens = Pc_ancien.objects.all().order_by('-date_ajout')
    demandes_peripheriques_en_attente, demandes_peripheriques_traitees = get_demandes_peripheriques()
    
    connected_user = None
    if 'user_id' in request.session:
        try:
            connected_user = Employe.objects.get(pk=request.session['user_id'])
        except Employe.DoesNotExist:
            del request.session['user_id']
            return redirect('connexion')
    if not connected_user or connected_user.fonction != 'RDOT':
        return redirect('connexion') 

    context = {
                'employes': employes,
                'pcs': pcs, 
                'connected_user': connected_user, 
                'caracteristiques_envoyees': caracteristiques_envoyees,
                'pcs_attribues': pcs_attribues,
                'pc_en_service': pc_en_service,
                'pc_total': pc_total,
                'pc_en_rebu': pc_en_rebu,
                'demandes_peripheriques_en_attente': demandes_peripheriques_en_attente,
                'demandes_peripheriques_traitees': demandes_peripheriques_traitees,
                'notifications': emails,
                'pcs_anciens': pcs_anciens,
                'pc_en_rebu_attribue': pc_en_rebu_attribue,
                'pc_total_global': pc_total_global,
                'marques': marques,
                'pcs_anciens_attribues': pcs_anciens_attribues,
                'modeles': modeles
                  }
    return render(request, 'page_DOT/dashboard_RDOT.html', context)

def dashboard_DOT(request):
    employes = Employe.objects.all()
    pcs = PC.objects.all()
    caracteristiques_envoyees = CaracteristiqueEnvoyee.objects.all().order_by('-date_envoi')
    pcs_attribues = Pc_attribué.objects.all().order_by('-date_attribution')
    pc_total = PC.objects.count()  
    pcs_anciens = Pc_ancien.objects.all().order_by('-date_ajout')
    pc_en_service= Pc_attribué.objects.count()
    pc_en_rebu= Pc_ancien.objects.count()
    marques=marquePC.objects.all()
    modeles=modelePC.objects.all()
    pcs_anciens_attribues = Pc_ancien_attribue.objects.select_related('employe').order_by('-date_attribution')
    pc_en_rebu_attribue = Pc_ancien_attribue.objects.count()
    pc_total_global=pc_total + pc_en_rebu + pc_en_rebu_attribue + pc_en_service
    connected_user = None
    emails = Email_DOT.objects.all()
    if 'user_id' in request.session:
        try:
            connected_user = Employe.objects.get(pk=request.session['user_id'])
        except Employe.DoesNotExist:
            del request.session['user_id']
            return redirect('connexion')
    if not connected_user or connected_user.fonction != 'DOT':
        return redirect('connexion')  


    context = {'employes': employes,
                'pcs': pcs,
                'connected_user': connected_user, 
                'caracteristiques_envoyees': caracteristiques_envoyees, 
                'pcs_attribues': pcs_attribues,
                'pc_total': pc_total, 
                'pc_en_service': pc_en_service,
                'pcs_anciens': pcs_anciens,
                'pc_en_rebu': pc_en_rebu,
                'marques': marques,
                'pc_en_rebu_attribue': pc_en_rebu_attribue,
                'pc_total_global': pc_total_global,
                'modeles': modeles,
                'pcs_anciens_attribues': pcs_anciens_attribues,
                'notifications': emails} 
    return render(request, 'page_DOT/dashboard_DOT.html', context)




def Admin(request):
    employes = Employe.objects.all()
    pcs = PC.objects.all()
    pcs_attribues = Pc_attribué.objects.all().order_by('-date_attribution')
    pcs_anciens = Pc_ancien.objects.all().order_by('-date_ajout')
    pc_total = PC.objects.count()  
    pc_en_service= Pc_attribué.objects.count()
    pc_en_rebu = Pc_ancien.objects.count()
    pcs_anciens_attribues = Pc_ancien_attribue.objects.select_related('employe').order_by('-date_attribution')
    marques=marquePC.objects.all()
    modeles=modelePC.objects.all()
    emails = Email.objects.all()
    connected_user = None
    if 'user_id' in request.session:
        try:
            connected_user = Employe.objects.get(pk=request.session['user_id'])
        except Employe.DoesNotExist:
            del request.session['user_id']
            return redirect('connexion')
    if not connected_user or connected_user.fonction != 'Admin':
        return redirect('connexion') 

    context = {'employes': employes,
                'pcs': pcs,
                'connected_user': connected_user,
                'pcs_attribues': pcs_attribues,
                'pcs_anciens': pcs_anciens,
                'pc_total': pc_total, 
                'pc_en_service': pc_en_service,
                'pc_en_rebu': pc_en_rebu,
                'marques': marques,
                'modeles': modeles,
                'pcs_anciens_attribues': pcs_anciens_attribues,
                'notifications':emails}
    return render(request, 'page_admin/custom-admin.html', context)