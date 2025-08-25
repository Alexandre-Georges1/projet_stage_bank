from django.urls import path
from Gestionnaire_pc import views
from Gestionnaire_pc.views.bordereau import envoyer_bordereau_employe, accepter_bordereau, bordereau_details
from Gestionnaire_pc.views.Mail import valider_ou_refuser_pc
from Gestionnaire_pc.views.gestion_demandes import gerer_demandes_achat

    
from Gestionnaire_pc.views import politique_confidentialite

urlpatterns = [

    path('connexion', views.connexion, name='connexion'),
    path('dashboard_employe/', views.dashboard_employe, name='dashboard_employe'),
    path('dashboard_DOT/', views.dashboard_DOT, name='dashboard_DOT'),
    path('dashboard_DCH/', views.dashboard_DCH, name='dashboard_DCH'),
    path('dashboard_MG/', views.dashboard_MG, name='dashboard_MG'),
    path('dashboard_RMG/', views.dashboard_RMG, name='dashboard_RMG'),
    path('dashboard_DAF/', views.dashboard_DAF, name='dashboard_DAF'),
    path('dashboard_RDOT/', views.dashboard_RDOT, name='dashboard_RDOT'),
    path('custom-admin/', views.Admin, name='custom_admin'),
    path('ajouter_utilisateur/', views.ajouter_utilisateur, name='ajouter_utilisateur'),
    path('ajouter_pc/', views.ajouter_pc, name='ajouter_pc'),
    path('modifier_utilisateur/<int:user_id>/', views.modifier_utilisateur, name='modifier_utilisateur'),
    path('supprimer_utilisateur/<int:user_id>/', views.supprimer_utilisateur, name='supprimer_utilisateur'),
    path('supprimer_pc/<int:pc_id>/', views.supprimer_pc, name='supprimer_pc'),
    path('modifier_pc/<int:pc_id>/', views.modifier_pc, name='modifier_pc'),
    path('deconnexion/', views.deconnexion, name='deconnexion'),
    path('enregistrer_employe/', views.enregistrer_employe, name='enregistrer_employe'),
    path('demander_caracteristique/', views.demander_caracteristique, name='demander_caracteristique'),
    path('envoyer_caracteristiques/', views.envoyer_caracteristiques, name='envoyer_caracteristiques'),
    path('assign_pc_via_form/', views.assign_pc_via_form, name='assign_pc_via_form'),
    path('gestion_marques/', views.gestion_marques, name='gestion_marques'),
    path('gestion_modeles/', views.gestion_modeles, name='gestion_modeles'),
    path('notifications/', views.get_notifications, name='get_notifications'),
    path('notifications/mark_as_read/<int:email_id>/', views.mark_notification_as_read, name='mark_notification_as_read'),
    path('racheter_pc/', views.racheter_pc, name='racheter_pc'),
    path('envoyer_bordereau_employe/', envoyer_bordereau_employe, name='envoyer_bordereau_employe'),
    path('accepter-bordereau/', accepter_bordereau, name='accepter_bordereau'),
    path('bordereau-details/<int:employe_id>/', bordereau_details, name='bordereau_details'),
    path('politique_confidentialite/', politique_confidentialite, name='politique_confidentialite'),
    path('demande-rachat/', views.demande_de_rachat, name='demande_de_rachat'),
    path('mon-bordereau/', views.bordereau_utilisateur, name='bordereau_utilisateur'),
    path('valider_ou_refuser_pc/', valider_ou_refuser_pc, name='valider_ou_refuser_pc'),
    path('restituer_pc/', views.restituer_pc, name='restituer_pc'),
    path('demande_achat_peripheriques/', views.demande_achat_peripheriques, name='demande_achat_peripheriques'),
    path('gerer_demandes_achat/', gerer_demandes_achat, name='gerer_demandes_achat'),
    path('notifications_dot/', views.get_notifications_dot, name='get_notifications_dot'),
    path('notifications_daf/', views.get_notifications_daf, name='get_notifications_daf'),
    path('notifications_mgx/', views.get_notifications_mgx, name='get_notifications_mgx'),
    path('notifications_rdot/', views.get_notifications_rdot, name='get_notifications_rdot'),
    path('amortir-pcs/', views.amortir_pcs, name='amortir_pcs'),
    path('pc-anciens/ajouter/', views.ajouter_pc_ancien, name='ajouter_pc_ancien'),
    path('pc-anciens/assigner/', views.assign_pc_ancien, name='assign_pc_ancien'),
    path('pc-anciens/<int:ancien_id>/modifier/', views.modifier_pc_ancien, name='modifier_pc_ancien'),
    path('pc-anciens/<int:ancien_id>/supprimer/', views.supprimer_pc_ancien, name='supprimer_pc_ancien'),
    # Attributions: modifier / supprimer
    path('attributions/<int:attribution_id>/supprimer/', views.supprimer_attribution, name='supprimer_attribution'),
    path('attributions/<int:attribution_id>/modifier/', views.modifier_attribution, name='modifier_attribution'),
    path('attributions/<int:attribution_id>/changer-pc/', views.changer_pc_attribution, name='changer_pc_attribution'),
    # PC anciens attribués: modifier / supprimer
    path('pc-anciens-attribues/<int:attribue_id>/supprimer/', views.supprimer_pc_ancien_attribue, name='supprimer_pc_ancien_attribue'),
    path('pc-anciens-attribues/<int:attribue_id>/modifier/', views.modifier_pc_ancien_attribue, name='modifier_pc_ancien_attribue'),
]
