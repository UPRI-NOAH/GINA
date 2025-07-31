from celery import shared_task
from django.conf import settings
from pywebpush import webpush, WebPushException
from api.gina.models import PushSubscription, UserTreeInfo, UserTreeArchive, Notification
import json
from django.contrib.auth import get_user_model
from urllib.parse import urlparse
from django.utils import timezone
from datetime import timedelta
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

@shared_task
def send_push_notification(user_id, title, body, notif_type, tree_id=None):
    print(user_id, title, body, tree_id)
    User = get_user_model()
    user = User.objects.get(id=user_id)
    subscriptions = PushSubscription.objects.filter(user=user)

    for sub in subscriptions:
        try:
            subscription_data = sub.subscription
            endpoint = subscription_data.get("endpoint")

            if not endpoint:
                print(f"No endpoint in subscription for user {user.username}: {sub.subscription}")
                continue

            aud = get_audience(endpoint)

            webpush(
                subscription_info=subscription_data,
                data=json.dumps({
                    "title": title,
                    "body": body,
                    "url": f"/map.html?focus={tree_id}&type={notif_type}" if tree_id else "/"
                }),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={
                    "aud": aud,
                    "sub": "mailto:upri.webgis@up.edu.ph",
                }
            )
            print(f"Notification sent to {user.username}")

        except WebPushException as e:
            status_code = getattr(e.response, "status_code", None)
            print(f"Push failed for {user.username}: {str(e)}")

            if status_code == 410:  # Subscription expired or user unsubscribed
                print(f"Removing expired subscription for {user.username}: {endpoint}")
                sub.delete()  # Delete the invalid subscription record


def get_audience(endpoint):
    print("Raw endpoint received:", endpoint)
    parsed = urlparse(endpoint)
    print("Parsed scheme:", parsed.scheme)
    print("Parsed netloc:", parsed.netloc)
    return f"{parsed.scheme}://{parsed.netloc}"


@shared_task
def send_tree_reminder(user_id, tree_ref_id, tree_name):
    User = get_user_model()
    user = User.objects.get(id=user_id)
    tree = UserTreeInfo.objects.get(reference_id=tree_ref_id)
    message = f"📅 It's time to update the photo of your tree: {tree_name}"

    # Save to Notification model (for badge + dropdown)
    Notification.objects.create(
        recipient=user,
        notif_type="reminder",
        message=message,
        related_tree=tree
    )

    # Send websocket for realtime notification
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "tree_notifications",
        {
            "type": "send_tree_notification",
            "message": message,
            "tree_owner": user.username,
            "user": None,
            "timestamp": timezone.now().isoformat(),
            "tree_id": str(tree.reference_id),
            "notif_type": "reminder"
        }
    )

    # Send push notification
    send_push_notification.delay(user.id, "Tree Update Reminder", message, "reminder", str(tree.reference_id))