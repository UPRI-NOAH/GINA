from channels.generic.websocket import AsyncWebsocketConsumer
import json

class TreeNotifConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "tree_notifications"  # shared group for everyone
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send(text_data=json.dumps({"message": "Connected to WebSocket"}))  # force test message

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_tree_notification(self, event):
        await self.send(text_data=json.dumps(event))
        # await self.send(text_data=json.dumps({
        #     'message': event['message'],
        #     'user': event['user'],
        #     'tree_owner': event['tree_owner'],
        #     'timestamp': event['timestamp'],
        #     'tree_id': event['tree_id'],
        #     'notif_type': event['notif_type'],
        # }))
