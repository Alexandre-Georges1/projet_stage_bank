from django.shortcuts import render, redirect
from django.http import JsonResponse   
from django.urls import reverse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.hashers import make_password,check_password
from ..models import Employe
from django.core.mail import send_mail
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone


def connexion(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')  
        # Compteur des tentatives échouées par identifiant (expire après 30 minutes)
        fail_key = f'login_fail_{username or ""}'
        FAIL_TTL = 60 * 30
        try:
            employe = Employe.objects.get(login=username)
            if check_password(password, employe.mot_de_passe):
                request.session['user_id'] = employe.pk

                # Reset compteur d'échecs si existant
                try:
                    cache.delete(fail_key)
                except Exception:
                    pass

                # Envoi d'un mail de confirmation à l'utilisateur (email en base)
                try:
                    dest = getattr(employe, 'email', '') or ''
                    if dest:
                        now = timezone.now().strftime('%d/%m/%Y %H:%M')
                        ip = request.META.get('REMOTE_ADDR', '')
                        subject = "Connexion réussie à votre compte"
                        message = (
                            f"Bonjour {getattr(employe, 'prenom', '')} {getattr(employe, 'nom', '')},\n\n"
                            f"Vous vous êtes connecté avec succès le {now} .\n"
                            "Si vous n'êtes pas à l'origine de cette action, veuillez contacter l’administrateur."
                        )
                        send_mail(
                            subject,
                            message,
                            getattr(settings, 'DEFAULT_FROM_EMAIL'),
                            [dest],
                            fail_silently=True
                        )
                except Exception:
                    # L'envoi du mail ne doit pas bloquer la connexion
                    pass

                response_data = {'success': True, 'user_fonction': employe.fonction}

                role = employe.fonction
        
                if role in ['DOT', 'RDOT', 'DCH', 'MG', 'RMG', 'DAF']:
                    response_data['redirect_url'] = reverse(f'dashboard_{role}')
                elif role in ['Admin', 'admin']:
                    response_data['redirect_url'] = reverse('custom_admin')
                else:
                    response_data['redirect_url'] = reverse('dashboard_employe')
                return JsonResponse(response_data)
            else:
                # Mot de passe incorrect, on passe à l'authentification LDAP
                raise Employe.DoesNotExist
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
                        mot_de_passe= make_password(password),
                        nom=nom,
                        prenom=prenom,
                    )
                    request.session['user_id'] = employe.pk
                    # Reset compteur d'échecs après succès
                    try:
                        cache.delete(fail_key)
                    except Exception:
                        pass
                    # Si l'utilisateur n'existait pas en base, notifier l'administrateur
                    if created:
                        try:
                            now = timezone.now().strftime('%d/%m/%Y %H:%M')
                            ip = request.META.get('REMOTE_ADDR', '')
                            subject = "Nouvelle connexion d'un utilisateur non répertorié"
                            message = (
                                f"Un utilisateur inconnu a été authentifié via LDAP et créé dans la base.\n\n"
                                f"Login: {username}\n"
                                f"Nom/Prénom: {prenom} {nom}\n"
                                f"Date/Heure: {now}\n"
                                f"Adresse IP: {ip}\n"
                            )
                            send_mail(
                                subject,
                                message,
                                getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@localhost'),
                                ["kaogeorges2006@gmail.com"],
                                fail_silently=True
                            )
                        except Exception:
                            pass
                except Exception as e:
                    return JsonResponse({
                        'success': False,
                        'error': f"Erreur création compte: {str(e)}"
                    }, status=500)

                
                response_data = {
                    'success': True,
                    'message': 'Authentifié via LDAP',
                    'user_role': user_role,
                    'user_fonction': user_role
                }

                # Redirection automatique selon le rôle
                if user_role in ['DOT', 'DCH', 'MG' , 'RDOT', 'RMG', 'DAF', 'Stagiaire']:
                    response_data['redirect_url'] = reverse(f'dashboard_{user_role}')
                elif user_role in ['Admin', 'admin']:
                    response_data['redirect_url'] = reverse('custom_admin')
                else:
                    response_data['redirect_url'] = reverse('dashboard_employe')
                # Envoi d'un mail de confirmation à l'utilisateur (email en base)
                try:
                    dest = getattr(employe, 'email', '') or ''
                    if dest:
                        now = timezone.now().strftime('%d/%m/%Y %H:%M')
                        ip = request.META.get('REMOTE_ADDR', '')
                        subject = "Connexion réussie à votre compte"
                        message = (
                            f"Bonjour {prenom} {nom},\n\n"
                            f"Vous vous êtes connecté avec succès le {now} depuis l'adresse IP {ip}.\n"
                            "Si vous n'êtes pas à l'origine de cette action, veuillez contacter l’administrateur."
                        )
                        send_mail(
                            subject,
                            message,
                            getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@localhost'),
                            [dest],
                            fail_silently=True
                        )
                except Exception:
                    pass
                return JsonResponse(response_data)
            else:
                # Échec local + LDAP -> incrément compteur et alerter après 3 échecs
                try:
                    count = cache.get(fail_key, 0) + 1
                    cache.set(fail_key, count, FAIL_TTL)
                    if count == 3:
                        emp = Employe.objects.filter(login=username).first()
                        dest = getattr(emp, 'email', '') if emp else ''
                        if dest:
                            now = timezone.now().strftime('%d/%m/%Y %H:%M')
                            ip = request.META.get('REMOTE_ADDR', '')
                            subject = "Avertissement: tentatives de connexion échouées"
                            message = (
                                f"Bonjour {getattr(emp, 'prenom', '')} {getattr(emp, 'nom', '')},\n\n"
                                f"Nous avons détecté 3 tentatives de connexion échouées sur votre compte ({username}) le {now} depuis l'adresse IP {ip}.\n"
                                "Si ce n’était pas vous, veuillez contacter l’administrateur."
                            )
                            send_mail(
                                subject,
                                message,
                                getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@localhost'),
                                [dest],
                                fail_silently=True
                            )
                except Exception:
                    pass

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
   
    # Purge l'auth Django si utilisée (LDAP)
    try:
        logout(request)
    except Exception:
        pass

    # Supprime la clé de session personnalisée si présente
    if 'user_id' in request.session:
        try:
            del request.session['user_id']
        except KeyError:
            pass

    if request.method == 'POST':
        return JsonResponse({'message': 'Déconnexion réussie!'})
    # Par défaut, pour GET (et autres), on redirige vers la connexion
    return redirect('connexion')

def politique_confidentialite(request):
    return render(request, 'politique_confidentialité.html')