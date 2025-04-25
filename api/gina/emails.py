from djoser.email import ActivationEmail
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.utils.http import urlsafe_base64_encode
from django.contrib.auth.tokens import default_token_generator


class CustomActivationEmail(ActivationEmail):
    template_name = 'register_activation.html'

    def send(self, to):

        context = self.get_context_data()

        user = context['user']

        uid = urlsafe_base64_encode(str(user.pk).encode())
        token = default_token_generator.make_token(user)

        activation_url = f"{context['protocol']}://{context['domain']}/activate.html?uid={uid}&token={token}"

        context['activation_url'] = activation_url

        subject = "Activate your GINA account"
        
        body = render_to_string(self.template_name, context)

        msg = EmailMultiAlternatives(
            subject=subject,
            body="View this email in an HTML-compatible viewer.",
            to=to,
        )
        msg.attach_alternative(body, "text/html")
        msg.send()