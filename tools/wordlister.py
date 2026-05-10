from os import listdir
from os.path import isfile, join

def update_words(PATH, FILE):
    files = [f for f in listdir(PATH) if isfile(join(PATH, f))]
    xmls = []

    for file in files:
        if file.endswith("-TEI.xml"):
            xmls.append(file.split("-TEI.xml")[0].lower())

    xmls.sort()

    with open(PATH + FILE, "w") as f:
        for word in xmls:
            f.write(word + "\n")

update_words("lemma/hungarian", "/words_hungarian.txt")
update_words("lemma/javanese", "/words_javanese.txt")
