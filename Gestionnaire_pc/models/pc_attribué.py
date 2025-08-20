from django.db import models
from datetime import date
from .Employe import Employe



class Pc_attribué(models.Model):
    id_attribue = models.AutoField(primary_key=True)
    marque = models.CharField(max_length=100, default="Marque inconnue")
    modele = models.CharField(max_length=100,default="Modèle inconnu")
    numero_serie = models.CharField(max_length=100, unique=True, default="Numéro de série inconnu")
    processeur = models.CharField(max_length=100, default="Processeur inconnu")
    ram = models.CharField(max_length=50, default="8 Go")
    disque_dur = models.CharField(max_length=50,default="500 Go")
    date_achat = models.DateField(default=date.today)
    employe = models.OneToOneField(Employe,on_delete=models.CASCADE,related_name="pc_attribue")
    date_attribution = models.DateField()
    status = models.CharField(max_length=32, default="non envoyé")
    validation_rmg = models.CharField(max_length=16, default="en attente") 
    validation_daf = models.CharField(max_length=16, default="en attente")  