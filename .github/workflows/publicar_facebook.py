import os
import requests
from datetime import datetime

PAGE_ID = os.environ["FACEBOOK_PAGE_ID"]
PAGE_TOKEN = os.environ["FACEBOOK_PAGE_TOKEN"]

PUBLICACIONES = [
    "🍕 Hoy es un buen día para disfrutar de una pizza en Pizzería NOYA. ¡Te esperamos!",
    "🔥 ¿Plan para hoy? Una pizza recién hecha y buena compañía. Ven a Pizzería NOYA.",
    "😋 ¿Ya sabes qué vas a comer hoy? Disfruta de nuestras pizzas en Pizzería NOYA.",
    "🍕 Sabor, buen ambiente y pizzas recién hechas. ¡Te esperamos en Pizzería NOYA!",
    "❤️ Gracias por elegir Pizzería NOYA. Ven a disfrutar con nosotros."
]

indice = datetime.now().toordinal() % len(PUBLICACIONES)
mensaje = PUBLICACIONES[indice]

url = f"https://graph.facebook.com/v23.0/{PAGE_ID}/feed"

respuesta = requests.post(
    url,
    data={
        "message": mensaje,
        "access_token": PAGE_TOKEN
    },
    timeout=30
)

if respuesta.ok:
    print("Publicación realizada correctamente.")
    print(respuesta.json())
else:
    print("Error al publicar:")
    print(respuesta.text)
    respuesta.raise_for_status()
