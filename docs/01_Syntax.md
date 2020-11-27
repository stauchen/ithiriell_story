# Syntax

In unserem Visual Novel Format besteht eine Geschichte aus Passagen. Eine Passage ihrerseits enthält die Szenenbeschreibung und die einzelnen Anweisungen darüber was wie dargestellt werden soll.

Eine neue Passage beginnt man mit einem Passagenkopf, bestehend aus zwei Doppelpunkten und dem Namen der Passage.

```
:: Begegnung in der Sternenhöhle
```

Hinter den Namen der Passage kann man noch in eckigen Klammern "tags" vergeben, um die Szene zu kategorisieren. Das erkläre ich später genauer. So sieht es jedenfalls aus: 

```
:: Begegnung in der Sternenhöhle [unheimlich]
```

Darunter kommt dann die Liste von Anweisungen. Das Drehbuch, sozusagen. Anweisungen beginnen mit einem '-' dann kommt der Name der Anweisung, dann ein Doppelpunkt und dann kommt die Konfiguration für die Anweisung. 

```
- description: Ein ganz normaler Wald. Hier gibt es nichts zu sehen
```

oder 

```
- setup:
    background: wald
    characters:
        - name: muecke
          caption: Mücke
          color: red
```

Die Einrückung ist dabei wichtig. In der 'setup' Anweisung oben sind 'background' und 'characters' weiter eingerückt als 'setup'. Damit weiß das Programm, dass diese Anweisungen zum Setup gehören. 'caption' und 'color' sind genau so weit eingerückt wie 'name' mit dem der Block losgeht. 

## Bestandteile einer Szene

Eine Szene besteht aus einem Hintergrund und einem oder zwei Charakteren. Dargestellt werden der Hintergrund, die Charaktere, ein Beschreibungstext oder ein gesprochener Text oder ein Auswahlmenü wenn eine Entscheidung gefordert ist. 

## Anweisungen

### setup

Setup benennt den Hintergrund und die Charaktere der Szene. 

```
- setup:
    background: wald
    characters:
        - name: muecke
          caption: Mücke
          color: red
          mood: besorgt
        - name: wolf
          caption: Wolf
          color: blue
```

`background` bezieht sich auf ein Bild im "images/backgrounds" Verzeichnis. Im oberen Beispiel "wald.png". Die Engine geht nur mit .pngs um. Ein Eintrag unter 'characters' besteht aus dem 'name', der den technischen Namen des Charakters angibt, der 'caption', was der angezeigte Name in Dialogen ist, 'color' ist die Textfarbe (hier gehen alle CSS Farbwanweisungen), und, optional, der 'mood' also eine Variante des Charakterbilds. Im obigen Beispiel würde links "Mücke" dargestellt mit ihrem Bild aus `images/muecke/besorgt.png` und "Wolf" rechts als `images/wolf/neutral.png` Wenn man etwas an der Szene ändern möchte, ein neuer Hintergrund oder eine andere Zusammenstellung der Charaktere, dann fügt man eine weitere `setup` Anweisung ein. Wenn man die `background` nicht verändern möchte, lässt man ihn bei der zweiten Anweisung einfach weg. `characters` muss man immer vollständig auflisten. 

### description

Stellt einen Beschreibungstext dar. 

```
- description: Die Nacht bricht herein und die Reisegruppe schlottert in ihren Mänteln. Es ist ein kalter Winter...
```

Man kann den Text in einer anderen Farbe als schwarz darstellen, indem man, auf gleicher Höhe wie die `description` eine `color` ergänzt: 

```
- description: Die Nacht bricht herein und die Reisegruppe schlottert in ihren Mänteln. Es ist ein kalter Winter...
  color: aqua
```
Wenn man einen Charakternamen benutzen möchte, ohne den Charakter darzustellen oder in einer `setup` Anweisung deklariert zu haben, kann man auch eine `caption` hinzufügen: 

```
- description: Wer stört die Eiskönigin in ihrer Ruhe ...? 
  caption: Eine klirrende Stimme
```

### character

Diese Anweisung benutzt man, um einen Charakter etwas sagen zu lassen: 

```
- character: muecke
  text: Hast Du das auch gehört?
```

Wenn nur ein Charakter in der Szene ist, wird er mittig dargestellt, sonst der erste links und der zweite rechts. Derjenige Charakter, der nicht spricht, wird abgedunkelt, damit man erkennen kann, wer etwas sagt. Man muss den technischen Namen (aus `name` im Setup) benutzen, um den Charakter zu addressieren. 

Die Werte für `color`, `caption` und `mood` werden aus dem Setup für den Charakter übernommen, aber man kann sie auch überschreiben: 

```
- character: muecke
  text: Hast Du das auch gehört?
  color: darkred
  mood: fluestern
```

Das ändert diese Werte dann auch für die weitere Szene.

### choice

Eine `choice` stellt den Leser vor eine Auswahl. Sie besteht aus mehreren `option` Anweisungen, die ihrerseits dann wieder eine oder mehrere andere Anweisungen enthalten können, was passieren soll, wenn die Option ausgewählt wurde. Ein paar Beispiele: 

```
- character: wolf
  text: Warum? Was ist denn **dein** Lieblingsgericht? 
- choice: 
    - option: Nudeln
      character: wolf
      text: Ja, das klingt auch gut.
    - option: Curry
      character: wolf
      text: Mit Curry konnte ich noch nie etwas anfangen.
```

Wählt der Leser "Nudeln", sagt Wolf "Ja, das klingt auch gut", wählt er "Curry" sagt Wolf "Mit Curry konnte ich noch nie etwas anfangen." Man kann jede der hier angegebenen Anweisungen zusammen mit einer `option` verwenden. Wenn man mehr als eine Anweisung als Teil einer Konsequenz passieren lassen möchte, verwendet man ein `script`: 

```
- description: Die Blume funkelt in den schönsten Farben und scheint Mücke geradezu anzulocken...
- character: wolf
  text: Nicht anfassen!
- choice:
    - option: Die Blume anfassen
      story:
        - description: Blitzschnell öffnet sich die Blume und schießt ihre giftigen Stacheln auf Mücke.
        - character: wolf
          text: Aufgepasst!
        - character: muecke
          text: Ich glaube mir geht es nicht ...
        - description: Mücke wird ohnmächtig
        - passage: Giftheilung
    - option: Die Blume nicht anfassen
      description: Mücke schaut sehnsüchtig zur Blume, kann sich aber zusammenreißen
```

### marker / jumpTo

Mit `marker` kann man eine Sprungmarke im Drehbuch definieren, die man dann mit `jumpTo` anspringt. 

```
- marker: Die Geschichte vom abgewetzten Mantel
- character: wolf
  text: Nun gut, ich erzähle es dir
...
```

Das ist vor allem in Verzweigungen sinnvoll:

```
- choice:
    - option: Frage nach Wolfs abgewetzten Mantel
      jumpTo: Die Geschichte vom abgewetzten Mantel
```

Man kann auch eine Endlosschleife bauen, aus der der Leser nur entkommt, wenn er eine bestimmte Auswahl trifft: 

```
- marker: Eintopfangebot
- character: bob
  text: Möchtest Du meinen selbstgemachten Käfereintopf probieren?
- choice:
    - option: Probiere den Eintopf
      passage: Lebensmittelvergiftung
    - option: Lehne höflich ab
- jumpTo: Eintopfangebot
```

So lange bis man mit "Probiere den Eintopf" aus der Schleife ausbricht landet man immer wieder beim Eintopfangebot.

### passage
Mit dieser Anweisung verlässt man diese Szene und springt zu einer anderen. Man gibt dazu den Namen der Zielpassage an, in der dann die neue Szene los geht: 

```
- passage: Begegnung in der Sternenhöhle
```

Dies ist vor allem sinnvoll um am Ende einer Szene zu einer anderen Szene weiter zu springen oder als Konsequenz einer Auswahl: 

```
- character: wolf
  text: Wo sollen wir lang gehen? 
- choice:
    - option: "Schneller, gefährlicher Weg"
      passage: Kampf gegen die Goblins
    - option: "Langsamer, sicherer Weg"
      passage: Entdeckung der Sternenhöhle
```

### Kommentare

## Textformatierung 

In einer `description`, `caption` oder dem `text` von einem `character` kann man einfache Formattierungen anwenden: Um den Text kursiv zu schreiben, umringt man den Textteil mit einem Stern, für fett nimmt man zwei Sterne: 

```
- description: *kursiv* normal **fett**
```

## Komplettes Beispiel
```
:: Beispiel Start 
- setup:
    background: wald
    characters:
        - name: muecke
          caption: Mücke
          color: red
- description: "Mücke hört ein Geräusch. Da ist noch jemand anderes im Wald ... "
- character: muecke
  text: Hallo, ist da wer?
- description: "Keine Antwort."
- character: muecke
  text: "**Halooohooooooo!**"
- description: "*raschel*"
  caption: ???
- setup:
    characters:
        - name: muecke
          caption: Mücke
          color: red
        - name: wolf
          caption: Wolf
          color: blue
- character: wolf
  text: "Du solltest nicht hier sein."
- description: "Mücke schaut Wolf herausfordernd an."
- character: muecke
  text: "Ich habe versprochen, nach ihm zu suchen."
- character: wolf
  text: "Dann bleib in meiner Nähe ..."
- passage: Verzweigung

:: Verzweigung
- setup:
    background: wald
    characters:
        - name: muecke
          caption: Mücke
          color: red
        - name: wolf
          caption: Wolf
          color: blue
- description: "Wolf und Mücke kommen an eine Weggabelung."
- choice: 
  - option: Wüste des Quälenden Durstes
    script:
      - character: muecke
        text: Packen wir lieber etwas Wasser ein
      - passage: Verlaufen in der Wüste
  - option: Berge der Ewigen Verdammnis
    passage: Berge der Ewigen Verdammnis

:: Verlaufen in der Wüste
- marker: anfang
- setup:
    background: wueste
- description: "Nach einer Weile des umherirrens stolpern Mücke und Wolf aus dem Wald heraus..."
- marker: richtungsauswahl
- choice: 
  - option: "Gehe nach Norden"
  - option: "Gehe nach Osten"
  - option: "Gehe nach Süden"
    jumpTo: verlaufen
  - option: "Gehe nach Westen"
    script:
      - description: Du kommst an einem seltsamen Stein vorbei, der dich anzulächeln scheint
      - choice:
        - option: Weiter gehen und den Stein nicht beachten
        - option: Den Stein höflich nach dem Weg fragen
          passage: Berge der Ewigen Verdammnis
- description: Hier sieht alles gleich aus...
- jumpTo: richtungsauswahl

- marker: verlaufen
- setup:
    characters:
        - name: wolf
          caption: Wolf
          color: blue
- character: wolf
  text: "Gut. Ich bin bereit einzuräumen, dass ich mich **vielleicht** verlaufen habe ..."
- setup:
    background: wueste
- jumpTo: richtungsauswahl
```