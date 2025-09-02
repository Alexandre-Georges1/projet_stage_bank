from django.db import models

class DemandeCaracteristique(models.Model):
    id_caracteristique_recue = models.AutoField(primary_key=True)
    # Contenu de la demande (texte libre)
    caracteristique = models.TextField(blank=True, default='')
    envoyeur = models.ForeignKey(
        'Employe', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='demandes_caracteristiques_envoyees'
    )
    employe_concerne = models.ForeignKey(
        'Employe', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='demandes_caracteristiques_concernees'
    )
    date_envoi = models.DateTimeField(auto_now_add=True)
    STATUT_CHOICES = (
        ("non recu", "non recu"),
        ("recu", "recu"),
    )
    statut = models.CharField(max_length=32, choices=STATUT_CHOICES, default="non recu", db_index=True)

