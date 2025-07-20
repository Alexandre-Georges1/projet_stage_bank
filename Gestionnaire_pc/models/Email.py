from django.db import models
class Email(models.Model):
    id_email = models.AutoField(primary_key=True)
    destinataire = models.EmailField(max_length=191)
    objet = models.CharField(max_length=255)
    corps=models.TextField(default='text')
    date_envoi = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False) # Nouveau champ pour le statut "lu"
    expediteur = models.ForeignKey('Employe', on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_emails')
