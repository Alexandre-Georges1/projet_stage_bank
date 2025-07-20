import imapclient
import pyzmail
from Gestionnaire_pc.models import Email 
def recuperer_mails():
    imap_host = 'imap.gmail.com'
    email_user = 'kaoalexandre2006@gmail.com'
    email_pass = 'votre_mot_de_passe_ou_mot_de_passe_application'

    with imapclient.IMAPClient(imap_host, ssl=True) as client:
        client.login(email_user, email_pass)
        client.select_folder('INBOX', readonly=True)

        messages = client.search(['UNSEEN'])  

        for uid in messages:
            raw_message = client.fetch(uid, ['BODY[]', 'FLAGS'])
            message = pyzmail.PyzMessage.factory(raw_message[uid][b'BODY[]'])

            expediteur = message.get_addresses('from')[0][1]
            sujet = message.get_subject()
            date = raw_message[uid].get(b'INTERNALDATE')
            corps = message.text_part.get_payload().decode(message.text_part.charset) if message.text_part else ''
            if not Email.objects.filter(uid=str(uid)).exists():
                Email.objects.create(
                    expediteur=expediteur,
                    objet=sujet,
                    corps=corps,
                    date_reception=date,
                    uid=str(uid)
                )
