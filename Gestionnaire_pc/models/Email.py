from django.db import models
class Email(models.Model):
    id_email = models.AutoField(primary_key=True)
    destinataire = models.EmailField(max_length=191)
    objet = models.CharField(max_length=255)
    corps=models.TextField(default='text')
    date_envoi = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False) 
    expediteur = models.ForeignKey('Employe', on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_emails')
class Email_DOT(models.Model):
    id_email = models.AutoField(primary_key=True)
    destinataire = models.EmailField(max_length=191)
    objet = models.CharField(max_length=255)
    corps=models.TextField(default='text')
    date_envoi = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)  # Indique si l'email a été lu ou non
    expediteur = models.ForeignKey('Employe', on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_emails_dot')

class Email_MGX(models.Model):
    id_email = models.AutoField(primary_key=True)
    destinataire = models.EmailField(max_length=191)
    objet = models.CharField(max_length=255)
    corps=models.TextField(default='text')
    date_envoi = models.DateTimeField(auto_now_add=True)
    expediteur = models.ForeignKey('Employe', on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_emails_mgx')
    is_read = models.BooleanField(default=False)  # Indique si l'email a été lu ou non
class Email_RMG(models.Model):
    id_email = models.AutoField(primary_key=True)
    destinataire = models.EmailField(max_length=191)
    objet = models.CharField(max_length=255)
    corps=models.TextField(default='text')
    date_envoi = models.DateTimeField(auto_now_add=True)
    expediteur = models.ForeignKey('Employe', on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_emails_rmg')
    is_read = models.BooleanField(default=False)  # Indique si l'email a été lu ou non
class Email_DCH(models.Model):
    id_email = models.AutoField(primary_key=True)
    destinataire = models.EmailField(max_length=191)
    objet = models.CharField(max_length=255)
    corps=models.TextField(default='text')
    date_envoi = models.DateTimeField(auto_now_add=True)
    expediteur = models.ForeignKey('Employe', on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_emails_dch')
    is_read = models.BooleanField(default=False)  # Indique si l'email a été lu ou non
class Email_RDOT(models.Model):
    id_email = models.AutoField(primary_key=True)
    destinataire = models.EmailField(max_length=191)
    objet = models.CharField(max_length=255)
    corps=models.TextField(default='text')
    date_envoi = models.DateTimeField(auto_now_add=True)
    expediteur = models.ForeignKey('Employe', on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_emails_rdot')
    is_read = models.BooleanField(default=False)  # Indique si l'email a été lu ou non
class Email_DAF(models.Model):
    id_email = models.AutoField(primary_key=True)
    destinataire = models.EmailField(max_length=191)
    objet = models.CharField(max_length=255)
    corps=models.TextField(default='text')
    date_envoi = models.DateTimeField(auto_now_add=True)
    expediteur = models.ForeignKey('Employe', on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_emails_daf')
    is_read = models.BooleanField(default=False)  # Indique si l'email a été lu ou non