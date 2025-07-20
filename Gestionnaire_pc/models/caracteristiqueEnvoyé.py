from django.db import models

class CaracteristiqueEnvoyee(models.Model):
    id_caracteristique_envoyee = models.AutoField(primary_key=True)
    marque = models.CharField(max_length=100)
    modele = models.CharField(max_length=100)
    processeur = models.CharField(max_length=100)
    ram = models.CharField(max_length=50)
    disque_dur = models.CharField(max_length=50)
    envoyeur = models.ForeignKey('Employe', on_delete=models.SET_NULL, null=True, blank=True, related_name='caracteristiques_envoyees')
    employe_concerne = models.ForeignKey('Employe', on_delete=models.SET_NULL, null=True, blank=True, related_name='caracteristiques_envoyées')
    date_envoi = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        envoyeur_str = self.envoyeur.prenom + " " + self.envoyeur.nom if self.envoyeur else 'N/A'
        concerne_str = self.employe_concerne.prenom + " " + self.employe_concerne.nom if self.employe_concerne else 'N/A'
        return f"{self.marque} {self.modele} - Envoyé par {envoyeur_str} pour {concerne_str}"
