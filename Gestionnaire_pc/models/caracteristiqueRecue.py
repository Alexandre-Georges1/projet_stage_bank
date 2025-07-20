from django.db import models
from .caracteristiqueEnvoyé import *

class CaracteristiqueRecue(models.Model):
    id_caracteristique_recue = models.AutoField(primary_key=True)
    caracteristique_envoyee = models.ForeignKey(CaracteristiqueEnvoyee, on_delete=models.CASCADE, related_name='recus')
    date_recu = models.DateTimeField(auto_now_add=True)
    employe = models.ForeignKey('Employe', on_delete=models.SET_NULL, null=True, blank=True, related_name='caracteristiques_recues')