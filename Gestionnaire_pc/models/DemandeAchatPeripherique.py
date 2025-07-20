from django.db import models
from .Employe import Employe

class DemandeAchatPeripherique(models.Model):
    MATERIEL_CHOICES = [
        ('Souris', 'Souris'),
        ('Clavier', 'Clavier'),
        ('Écran', 'Écran'),
        ('Imprimante', 'Imprimante'),
        ('Autre', 'Autre'),
    ]
    
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('approuve', 'Approuvé'),
        ('refuse', 'Refusé'),
        ('en_cours', 'En cours de traitement'),
        ('livre', 'Livré'),
    ]

    id_demande = models.AutoField(primary_key=True)
    employe = models.ForeignKey(Employe, on_delete=models.CASCADE, related_name='demandes_achat')
    materiel = models.CharField(max_length=50, choices=MATERIEL_CHOICES)
    objet_demande = models.CharField(max_length=255, default='Demande d\'achat de périphérique')
    commentaires = models.TextField(blank=True, null=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    date_demande = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    traite_par = models.ForeignKey(Employe, on_delete=models.SET_NULL, null=True, blank=True, related_name='demandes_traitees')
    
    class Meta:
        db_table = 'demande_achat_peripherique'
        ordering = ['-date_demande']
        
    def __str__(self):
        return f"{self.employe.nom} {self.employe.prenom} - {self.materiel} ({self.statut})"
    
    def get_statut_display_class(self):
        """Retourne la classe CSS pour l'affichage du statut"""
        classes = {
            'en_attente': 'statut-en-attente',
            'approuve': 'statut-approuve',
            'refuse': 'statut-refuse',
            'en_cours': 'statut-en-cours',
            'livre': 'statut-livre'
        }
        return classes.get(self.statut, 'statut-default')
