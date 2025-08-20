from django.db import models
from .Employe import Employe


class Pc_ancien_attribue(models.Model):
    id_attribue_ancien = models.AutoField(primary_key=True)
    employe = models.ForeignKey(Employe, on_delete=models.SET_NULL, null=True, blank=True, related_name='pc_anciens_attribues')
    date_attribution = models.DateField()
    date_fin_attribution = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    marque = models.CharField(max_length=100, null=True, blank=True)
    modele = models.CharField(max_length=100, null=True, blank=True)
    numero_serie = models.CharField(max_length=100, null=True, blank=True)
    processeur = models.CharField(max_length=100, null=True, blank=True)
    ram = models.CharField(max_length=50, null=True, blank=True)
    disque_dur = models.CharField(max_length=50, null=True, blank=True)
    date_achat = models.DateField(null=True, blank=True)

