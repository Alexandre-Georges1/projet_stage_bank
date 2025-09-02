from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Q

from .models import CaracteristiqueEnvoyee, DemandeCaracteristique


@receiver(post_save, sender=CaracteristiqueEnvoyee)
def mark_demande_as_received(sender, instance: CaracteristiqueEnvoyee, created: bool, **kwargs):
    """Quand une caractéristique est envoyée, marquer comme 'recu' les demandes correspondantes.
    Correspondance basée sur le nom + prénom de l'employé concerné.
    """
    if not created:
        return

    employe = instance.employe_concerne
    if not employe:
        return

    # Met à jour toutes les demandes (statut 'non recu') pour cet employé par nom/prenom
    DemandeCaracteristique.objects.filter(
        Q(employe_concerne__nom=employe.nom),
        Q(employe_concerne__prenom=employe.prenom),
        Q(statut__iexact="non recu"),
    ).update(statut="recu")
