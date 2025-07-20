from django.db import models
class PC(models.Model):
    id_pc = models.AutoField(primary_key=True)
    marque = models.ForeignKey('marquePC', on_delete=models.CASCADE, related_name='pcs')
    modele = models.ForeignKey('modelePC', on_delete=models.CASCADE, related_name='pcs')
    numero_serie = models.CharField(max_length=100, unique=True)
    processeur = models.CharField(max_length=100)
    ram = models.CharField(max_length=50)
    disque_dur = models.CharField(max_length=50)
    date_achat = models.DateField()
    
class marquePC(models.Model):
    id_marque = models.AutoField(primary_key=True)
    nom_marque = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nom_marque

class modelePC(models.Model):
    id_modele = models.AutoField(primary_key=True)
    nom_modele = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.nom_modele
