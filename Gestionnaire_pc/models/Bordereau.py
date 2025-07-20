from django.utils import timezone
from django.db import models
from .Employe import Employe
from datetime import date

class Bordereau(models.Model):
    statut = models.CharField(max_length=32, default="non lu")
    date_statut = models.DateTimeField(null=True, blank=True)
    id_bordereau = models.AutoField(primary_key=True)
    employe = models.ForeignKey(Employe, on_delete=models.CASCADE, related_name='bordereaux_recus')
    date_creation = models.DateField(default=date.today)
    nom_employe = models.CharField(max_length=100)
    prenom_employe = models.CharField(max_length=100)
    marque_pc = models.CharField(max_length=100)
    modele_pc = models.CharField(max_length=100)
    numero_serie_pc = models.CharField(max_length=100)
    description_pc = models.TextField() 
    telephone_employe = models.CharField(max_length=20, blank=True, null=True)
    email_employe = models.EmailField(blank=True, null=True)
    
    def __str__(self):
        return f"Bordereau pour {self.prenom_employe} {self.nom_employe} - PC: {self.marque_pc} {self.modele_pc}" 