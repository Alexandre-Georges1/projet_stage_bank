from django.db import models
from .pc import PC
from .Employe import Employe


class Pc_ancien(models.Model):
    id_ancien = models.AutoField(primary_key=True)
    marque = models.CharField(max_length=100, null=True, blank=True)
    modele = models.CharField(max_length=100, null=True, blank=True)
    numero_serie = models.CharField(max_length=100, null=True, blank=True)
    processeur = models.CharField(max_length=100, null=True, blank=True)
    ram = models.CharField(max_length=50, null=True, blank=True)
    disque_dur = models.CharField(max_length=50, null=True, blank=True)
    date_achat = models.DateField(null=True, blank=True)
    employe = models.ForeignKey(Employe, on_delete=models.SET_NULL, null=True, blank=True)

    date_ajout = models.DateField(auto_now_add=True)