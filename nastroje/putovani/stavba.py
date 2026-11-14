# Generátor putování čínštiny -> put-zh/cinstina.json (texty cs a en; ostatní jazyky doplní překladatelé)
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pomoc import O, P

def L(cs, en):
    return {"cs": cs, "en": en}

etapy = []

# ================================================================ 1 prasinotibetština
etapy.append({
 "id": "prasinotibetstina",
 "doba": L("asi 7000 – 4000 př. n. l. (odhady se liší)", "c. 7000 – 4000 BCE (estimates differ)"),
 "pohled": [99, 30, 1.7],
 "nazev": L("Prasinotibetština", "Proto-Sino-Tibetan"),
 "text": L(
  "Čínština patří do sinotibetské jazykové rodiny (George van Driem ji nazývá transhimálajskou), která má asi 500 jazyků a kolem 1,4 miliardy mluvčích; vedle čínských jazyků k ní patří tibetština, barmština a stovky menších jazyků od Himálaje po Myanmar. Kde a kdy se mluvilo jejím prajazykem, je sporné. Dvě fylogenetické studie z roku 2019 jej kladou na sever Číny, mezi zemědělce pěstující proso na střední a horní Žluté řece: podle Zhanga a kol. (Nature) se rodina začala štěpit asi před 5900 lety, v době kultury Jang-šao a pozdější Ma-ťia-jao, podle Sagarta a kol. (PNAS) asi před 7200 lety, na konci kultury Cchi-šan a na počátku Jang-šao. Jiní badatelé kladou počátky rodiny do jihozápadní Číny nebo na severovýchod Indie, a to až před devět tisíc let. Sporné je i vnitřní členění: tradičně se rodina dělí na čínskou a tibetobarmskou větev a podle Sagarta a kol. se čínské jazyky možná oddělily jako první, van Driem však tibetobarmskou větev jako samostatnou skupinu odmítá. Podle severní hypotézy se část mluvčích šířila z Kan-su na jihozápad přes Tibetskou náhorní plošinu a jiní na jih horskými údolími k Jün-nanu a Myanmaru.",
  "Chinese belongs to the Sino-Tibetan language family (George van Driem calls it Trans-Himalayan), which has about 500 languages and some 1.4 billion speakers; besides the Chinese languages it includes Tibetan, Burmese and hundreds of smaller languages from the Himalayas to Myanmar. Where and when its proto-language was spoken is disputed. Two phylogenetic studies published in 2019 place it in northern China, among millet farmers on the middle and upper Yellow River: according to Zhang et al. (Nature) the family began to split about 5,900 years ago, at the time of the Yangshao and later Majiayao cultures; according to Sagart et al. (PNAS) about 7,200 years ago, at the end of the Cishan and the beginning of the Yangshao culture. Other scholars place the family’s origins in south-western China or north-eastern India, as long as nine thousand years ago. Its internal structure is also disputed: traditionally the family is divided into a Chinese and a Tibeto-Burman branch, and according to Sagart et al. the Chinese languages may have been the first to split off, whereas van Driem rejects Tibeto-Burman as a separate group. According to the northern hypothesis some speakers spread from Gansu south-west across the Tibetan Plateau, and others south through the mountain valleys towards Yunnan and Myanmar."),
 "oblasti": [
  O("pravlast", [(107.5, 34.8, 1.5), (104.3, 35.6, 1.3), (111.3, 34.9, 1.2), (113.9, 36.4, 0.9)], "sit",
    L("prasinotibetština (Žlutá řeka)", "Proto-Sino-Tibetan (Yellow River)")),
  O("jihozapad", [(103.8, 30.3, 1.2), (93.9, 25.7, 1.1)], "sit",
    L("jiná hypotéza: jihozápad", "alternative: the south-west"), sporna=True),
  O("tibet", [(91.0, 30.2, 1.5), (86.5, 29.0, 1.1), (95.8, 31.6, 1.1)], "tb",
    L("Tibetská plošina", "Tibetan Plateau"), po="na-tibet"),
  O("myanmar", [(100.6, 25.2, 1.1), (96.2, 22.0, 1.3), (95.0, 19.3, 0.9)], "tb",
    L("tibetobarmské jazyky na jihu", "Tibeto-Burman in the south"), po="na-jih", sporna=True),
 ],
 "proudy": [
  P("na-tibet", [(104.0, 36.0), (101.8, 36.6), (98.5, 35.5), (95.5, 33.6), (92.5, 31.6), (91.1, 29.9)], "tb",
    L("na Tibetskou plošinu", "onto the Tibetan Plateau")),
  P("na-jih", [(104.2, 34.2), (103.5, 31.8), (102.2, 28.5), (100.8, 25.8), (98.0, 23.3), (96.0, 21.2)], "tb",
    L("na jih (sporné)", "to the south (disputed)"), sporna=True),
 ]
})

# ================================================================ 2 stará čínština
etapy.append({
 "id": "stara-cinstina",
 "doba": L("asi 1250 – 256 př. n. l.", "c. 1250 – 256 BCE"),
 "pohled": [110.5, 35.2, 3.0],
 "nazev": L("Věštebné kosti a stará čínština", "Oracle bones and Old Chinese"),
 "text": L(
  "Nejstarší souvislé doklady čínštiny jsou nápisy na věštebných kostech, lopatkách skotu a želvích krunýřích, do nichž věštci posledních králů dynastie Šang vyrývali otázky a odpovědi. Většina jich pochází z Jin-sü (殷墟), poslední šangské metropole u dnešního An-jangu v provincii Che-nan; nejstarší pocházejí z doby krále U Tinga, kterou radiokarbonové datování kostí klade asi do let 1254–1197 př. n. l. Písmo je v nich už vyspělé a mnoho znaků lze sledovat až k dnešním. Jazyk šangských a čouských nápisů a nejstarších textů, jako je Kniha písní (Š'-ťing), se nazývá stará čínština; jeho výslovnost se rekonstruuje z rýmů, ze stavby znaků a z pozdějších čínských variet a jednotlivé rekonstrukce se liší (Baxter a Sagart 2014). Kolem poloviny 11. století př. n. l. porazili Šang Čouové z údolí řeky Wej; bronzové nádoby s dlouhými nápisy pak šířily týž psaný jazyk po celém povodí střední Žluté řeky. Na západ od Šangů žili Čchiangové, které nápisy zmiňují jako nepřátele; jakým jazykem mluvili, není známo. Jako písmo rozpoznal věštebné kosti teprve roku 1899 učenec Wang I-žung.",
  "The earliest continuous records of Chinese are inscriptions on oracle bones – cattle shoulder blades and turtle shells into which the diviners of the last kings of the Shang dynasty carved questions and answers. Most come from Yinxu (殷墟), the last Shang capital near present-day Anyang in Henan province; the oldest date from the reign of King Wu Ding, which radiocarbon dating of the bones places at about 1254–1197 BCE. The script is already mature, and many characters can be traced down to those used today. The language of the Shang and Zhou inscriptions and of the oldest texts, such as the Book of Odes (Shijing), is called Old Chinese; its pronunciation is reconstructed from rhymes, from the structure of the characters and from later Chinese varieties, and the reconstructions differ (Baxter and Sagart 2014). Around the middle of the 11th century BCE the Shang were defeated by the Zhou from the Wei valley; bronze vessels with long inscriptions then spread the same written language across the middle Yellow River basin. West of the Shang lived the Qiang, whom the inscriptions mention as enemies; what language they spoke is unknown. The oracle bones were recognised as writing only in 1899, by the scholar Wang Yirong."),
 "oblasti": [
  O("sang", [(114.35, 36.1, 0.8), (113.6, 34.75, 0.75), (112.8, 34.7, 0.5), (115.5, 35.2, 0.6)], "och",
    L("Šang (An-jang)", "Shang (Anyang)")),
  O("cou", [(107.9, 34.45, 0.5), (107.1, 34.5, 0.35)], "och",
    L("Čou (údolí Wej)", "Zhou (Wei valley)")),
  O("cchiang", [(103.4, 35.4, 0.9)], "tb",
    L("Čchiangové (jazyk neznámý)", "Qiang (language unknown)"), sporna=True),
 ],
 "proudy": [
  P("cou-na-vychod", [(107.9, 34.45), (109.3, 34.5), (110.9, 34.55), (112.6, 34.68)], "och",
    L("Čou na východ (11. st. př. n. l.)", "Zhou move east (11th c. BCE)")),
 ]
})

# ================================================================ 3 klasická čínština a sjednocení
etapy.append({
 "id": "klasicka",
 "doba": L("asi 500 př. n. l. – 220 n. l.", "c. 500 BCE – 220 CE"),
 "pohled": [111, 30, 1.9],
 "nazev": L("Klasická čínština a sjednocení říše", "Classical Chinese and the unification of the empire"),
 "text": L(
  "V období Válčících států (475–221 př. n. l.) vznikla díla, z nichž vychází klasická čínština (wen-jen, 文言): Hovory, do nichž Konfuciovi (551–479 př. n. l.) žáci zapsali jeho výroky, a spisy Mencia, Mo-c' a Čuang-c'. Jednotlivé státy psaly různými tvary znaků. Když roku 221 př. n. l. stát Čchin porazil poslední soupeře a jeho vládce přijal titul Čchin Š'-chuang, První císař, sjednotil podle tradice spolu s měrami a mincemi i písmo: vzorem bylo čchinské písmo, později zvané malá pečeť, a vedle něj se šířilo jednodušší úřednické písmo li-šu, které vzniklo z běžného písma písařů. Jak rychle a důkladně sjednocení proběhlo, je sporné; vykopané rukopisy ukazují pestrost tvarů ještě dlouho poté (Galambos 2004). Už vojska Čchin a po nich dynastie Chan (206 př. n. l. – 220 n. l.) dobyla jih až k dnešnímu Kantonu a roku 111 př. n. l. i sever dnešního Vietnamu, kde žily národy nečínských jazyků, souhrnně nazývané Pai-jüe; jakými jazyky mluvily, je nejisté. Od jména dynastie se odvozuje označení Chanové i čínského jazyka chan-jü (汉语). Kolem roku 100 n. l. dokončil Sü Šen slovník Šuo-wen ťie-c', který rozebírá stavbu 9353 znaků. Klasická čínština zůstala spisovným jazykem až do počátku 20. století, ačkoli se od ní mluvená řeč mezitím hodně vzdálila.",
  "The Warring States period (475–221 BCE) produced the works on which Classical Chinese (wenyan, 文言) is based: the Analects, in which the disciples of Confucius (551–479 BCE) recorded his sayings, and the writings of Mencius, Mozi and Zhuangzi. Each state wrote characters in its own forms. When in 221 BCE the state of Qin defeated its last rivals and its ruler took the title Qin Shi Huang, the First Emperor, he is traditionally said to have standardised the script along with weights, measures and coinage: the model was the Qin script later called small seal, and alongside it spread the simpler clerical script (lishu), which had grown out of the everyday hand of scribes. How quickly and how thoroughly the standardisation took effect is disputed; excavated manuscripts show a variety of forms long afterwards (Galambos 2004). The armies of Qin, and after them the Han dynasty (206 BCE – 220 CE), conquered the south as far as present-day Guangzhou and in 111 BCE also what is now northern Vietnam, home to peoples speaking non-Chinese languages who were known collectively as the Baiyue; which languages they spoke is uncertain. The name of the dynasty gave rise to the terms Han for the Chinese people and Hanyu (汉语) for their language. Around 100 CE Xu Shen completed the dictionary Shuowen jiezi, which analyses the structure of 9,353 characters. Classical Chinese remained the written standard until the early 20th century, even though the spoken language had by then moved far away from it."),
 "oblasti": [
  O("valcici-staty", [(117.0, 35.6, 0.9), (118.3, 36.7, 0.7), (114.6, 35.1, 0.9), (112.6, 34.7, 0.7), (114.5, 37.4, 0.7)], "kla",
    L("klasická čínština", "Classical Chinese")),
  O("cchin", [(108.7, 34.4, 0.8), (106.6, 34.5, 0.6)], "ri",
    L("Čchin (Sien-jang)", "Qin (Xianyang)")),
  O("pai-jue", [(113.3, 23.6, 1.2), (110.0, 23.6, 1.0), (118.8, 26.2, 1.0), (116.4, 24.6, 0.8), (106.0, 21.4, 0.8)], "jih",
    L("Pai-jüe (jazyky jihu)", "Baiyue (southern languages)"), sporna=True),
 ],
 "proudy": [
  P("sjednoceni", [(108.7, 34.4), (110.8, 34.6), (113.4, 35.0), (115.8, 35.7), (118.2, 36.7)], "ri",
    L("sjednocení (221 př. n. l.)", "unification (221 BCE)")),
  P("na-jih", [(108.9, 34.1), (110.4, 32.2), (112.2, 30.4), (112.9, 28.3), (112.6, 25.8), (113.2, 23.4)], "ri",
    L("na jih (214 a 111 př. n. l.)", "to the south (214 and 111 BCE)")),
  P("do-tiao-c", [(112.6, 25.8), (110.6, 24.2), (108.6, 22.9), (107.0, 22.0), (106.0, 21.2)], "ri",
    L("do Ťiao-č' (111 př. n. l.)", "to Jiaozhi (111 BCE)")),
 ]
})

# ================================================================ 4 jih
etapy.append({
 "id": "jih",
 "doba": L("asi 300 – 1300", "c. 300 – 1300"),
 "pohled": [114.5, 28.5, 2.3],
 "nazev": L("Na jih od Jang-c'-ťiang", "South of the Yangtze"),
 "text": L(
  "Mluvená čínština se nejvíc rozrůznila na jihu, kam z povodí Žluté řeky přicházely vlny osadníků. Už za dynastie Chan pronikali do Fu-ťienu osadníci z dnešního Če-ťiangu a nejstarší vrstvy jazyků min se podle Jerryho Normana oddělily od ostatní čínštiny přibližně v té době. Po dobytí Luo-jangu roku 311 uprchla velká část severní elity na jih a Východní Ťin vládl z Ťien-kchangu, dnešního Nan-ťingu; další vlny přinesly povstání An Lu-šana (755–763) a pád severní Sung roku 1127, po němž se dvůr usadil v Chang-čou. Nová severní řeč se vrstvila na starší čínštinu i na nečínské jazyky jihu. Tak se utvářely skupiny, které se dnes nazývají wu (Šanghaj, Su-čou), kan (Ťiang-si), siang (Chu-nan), min (Fu-ťien), jüe (kantonština) a hakka; hakka vznikla v horách na pomezí Ťiang-si, Fu-ťienu a Kuang-tungu a tradiční vyprávění o pěti vlnách stěhování jejích předků ze severu je sporné. Tyto variety si navzájem často nerozumějí; čínská tradice je nazývá fang-jen (方言, „místní řeči“), což se obvykle překládá jako „dialekty“, jazykovědci je však často pokládají za samostatné jazyky. Jazyk této doby, střední čínština, je zachycen v rýmovém slovníku Čchie-jün, který roku 601 dokončil Lu Fa-jen; zda popisuje řeč jednoho města, nebo normu složenou z několika nářečí, je sporné.",
  "Spoken Chinese diversified most in the south, where successive waves of settlers arrived from the Yellow River basin. As early as the Han dynasty settlers from present-day Zhejiang moved into Fujian, and according to Jerry Norman the oldest layers of the Min languages split from the rest of Chinese at about that time. After Luoyang fell in 311 much of the northern elite fled south, and the Eastern Jin ruled from Jiankang, today’s Nanjing; further waves followed the An Lushan rebellion (755–763) and the fall of the Northern Song in 1127, after which the court settled in Hangzhou. The new northern speech was layered over older Chinese and over the non-Chinese languages of the south. This is how the groups known today as Wu (Shanghai, Suzhou), Gan (Jiangxi), Xiang (Hunan), Min (Fujian), Yue (Cantonese) and Hakka took shape; Hakka formed in the mountains where Jiangxi, Fujian and Guangdong meet, and the traditional account of five waves of migration of its speakers’ ancestors from the north is disputed. These varieties are often mutually unintelligible; Chinese tradition calls them fangyan (方言, ‘local speech’), usually translated as ‘dialects’, although linguists often regard them as separate languages. The language of this period, Middle Chinese, is recorded in the rhyme dictionary Qieyun, completed by Lu Fayan in 601; whether it describes the speech of a single city or a standard combining several dialects is disputed."),
 "oblasti": [
  O("sever", [(112.5, 34.6, 0.9), (108.9, 34.3, 0.8), (114.4, 34.8, 0.7), (116.8, 36.6, 0.8), (116.4, 39.9, 0.7)], "zhn",
    L("střední čínština (sever)", "Middle Chinese (north)")),
  O("wu", [(120.3, 30.2, 0.65), (120.6, 31.35, 0.55), (119.7, 29.0, 0.55), (121.3, 31.1, 0.3)], "wu",
    L("wu", "Wu")),
  O("min", [(119.3, 26.1, 0.55), (118.3, 25.0, 0.55), (117.7, 26.7, 0.5)], "min",
    L("min (Fu-ťien)", "Min (Fujian)"), po="do-fu-tienu"),
  O("hakka", [(116.1, 24.3, 0.45), (116.0, 25.5, 0.45)], "hak",
    L("hakka", "Hakka"), po="hakka", sporna=True),
  O("jue", [(113.3, 23.1, 0.65), (111.6, 23.0, 0.55), (110.3, 22.6, 0.45), (112.3, 22.3, 0.4)], "yue",
    L("jüe (kantonština)", "Yue (Cantonese)")),
  O("kan", [(115.9, 28.7, 0.6), (115.0, 27.2, 0.55)], "gan",
    L("kan", "Gan")),
  O("siang", [(112.9, 28.2, 0.6), (111.5, 27.3, 0.55)], "xia",
    L("siang", "Xiang")),
 ],
 "proudy": [
  P("po-roce-311", [(112.5, 34.6), (114.0, 33.5), (116.2, 32.7), (117.9, 32.3), (118.8, 32.05)], "zhn",
    L("na jih po roce 311", "south after 311")),
  P("rok-1127", [(114.4, 34.8), (116.3, 33.5), (118.0, 32.6), (119.4, 32.1), (120.1, 30.9), (120.15, 30.3)], "zhn",
    L("dvůr Sung na jih (1127)", "Song court moves south (1127)")),
  P("do-fu-tienu", [(120.6, 30.0), (120.3, 28.8), (119.8, 27.6), (119.3, 26.2)], "min",
    L("do Fu-ťienu (od 2. st. př. n. l.)", "into Fujian (from the 2nd c. BCE)")),
  P("hakka", [(115.9, 28.6), (115.6, 27.1), (115.9, 25.9), (116.1, 24.5)], "hak",
    L("předkové hakka (sporné)", "ancestors of the Hakka (disputed)"), sporna=True),
 ]
})

# ================================================================ 5 sinosféra
etapy.append({
 "id": "sinosfera",
 "doba": L("asi 100 př. n. l. – počátek 20. století", "c. 100 BCE – early 20th century"),
 "pohled": [119, 31, 1.6],
 "nazev": L("Čínské písmo ve východní Asii", "Chinese writing in East Asia"),
 "text": L(
  "Čínské písmo a s ním klasická čínština se staly psaným jazykem velké části východní Asie, ačkoli se tam mluvilo nepříbuznými jazyky. Do Koreje se dostaly nejpozději s chanskými komandériemi, z nichž Le-lang u dnešního Pchjongjangu vznikla roku 108 př. n. l., do Japonska přes Korejský poloostrov, nejpozději v 5. století. Úředníci, mniši a učenci četli čínské texty po svém: v Japonsku metodou kanbun kundoku, při níž čtenář přeskupuje slova podle japonské větné stavby a doplňuje japonské koncovky, v Koreji podobným způsobem. Z čínských znaků vznikla i vlastní písma: japonské slabičné kana v 9. století a vietnamské chữ Nôm, doložené nápisy od 11. a texty od 13. století. V Koreji vyhlásil král Sedžong roku 1446 hangul, hláskové písmo nečínského typu. Slova přejatá z čínštiny tvoří podle srovnávacích přehledů v japonštině a korejštině zhruba polovinu slovní zásoby, ve vietnamštině kolem 70 %; protože uchovávají starší výslovnost, pomáhají rekonstruovat střední čínštinu. Vietnam, který byl s přestávkami pod čínskou vládou až do 10. století, pořádal úřednické zkoušky v klasické čínštině až do roku 1919; pak převládla latinka quốc ngữ. Japonsko čínské znaky (kandži) užívá dodnes, Korea je z většiny nahradila hangulem.",
  "Chinese writing, and with it Classical Chinese, became the written language of much of East Asia, although the languages spoken there were unrelated. It reached Korea no later than with the Han commanderies, of which Lelang near present-day Pyongyang was founded in 108 BCE, and Japan via the Korean peninsula, by the 5th century at the latest. Officials, monks and scholars read Chinese texts in their own way: in Japan by the kanbun kundoku method, in which the reader rearranges the words to fit Japanese word order and adds Japanese endings, and in Korea in a similar way. Chinese characters also gave rise to scripts of their own: the Japanese kana syllabaries in the 9th century and Vietnamese chữ Nôm, attested in inscriptions from the 11th century and in texts from the 13th. In Korea King Sejong promulgated hangul, an alphabet not of the Chinese type, in 1446. According to comparative surveys, words borrowed from Chinese make up roughly half of the vocabulary of Japanese and Korean and about 70 per cent of that of Vietnamese; because they preserve older pronunciations, they help to reconstruct Middle Chinese. Vietnam, under Chinese rule with interruptions until the 10th century, held civil service examinations in Classical Chinese until 1919, after which the Latin-based quốc ngữ prevailed. Japan still uses Chinese characters (kanji) today, while Korea has largely replaced them with hangul."),
 "oblasti": [
  O("cina", [(113.0, 34.5, 1.1), (117.0, 36.2, 0.9), (119.0, 31.2, 0.9), (108.9, 34.3, 0.8), (114.0, 30.5, 0.8)], "kla",
    L("klasická čínština", "Classical Chinese")),
  O("korea", [(125.8, 39.0, 0.7), (127.0, 37.5, 0.65), (128.8, 35.9, 0.6), (127.0, 35.6, 0.5)], "sx",
    L("Korea", "Korea"), po="do-koreje"),
  O("japonsko", [(130.6, 33.4, 0.55), (135.8, 34.7, 0.6), (133.9, 34.7, 0.45), (139.7, 35.7, 0.5)], "jap",
    L("Japonsko", "Japan"), po="do-japonska"),
  O("vietnam", [(105.85, 21.0, 0.6), (106.2, 20.4, 0.4)], "sx",
    L("Vietnam", "Vietnam"), po="do-vietnamu"),
 ],
 "proudy": [
  P("do-koreje", [(116.4, 39.9), (118.4, 39.95), (120.0, 40.7), (121.8, 41.4), (123.2, 41.2), (124.3, 40.3), (125.5, 39.7), (125.75, 39.05)], "sx",
    L("do Koreje (108 př. n. l.)", "to Korea (108 BCE)")),
  P("do-japonska", [(126.9, 36.3), (127.8, 35.6), (128.7, 35.3), (129.05, 35.12), (129.75, 34.5), (130.1, 33.95), (130.38, 33.63), (130.45, 33.57)], "jap",
    L("do Japonska (nejpozději 5. st.)", "to Japan (5th c. at the latest)")),
  P("do-vietnamu", [(113.3, 23.1), (111.0, 22.9), (109.0, 22.6), (107.2, 21.9), (105.9, 21.05)], "sx",
    L("do Vietnamu", "to Vietnam")),
 ]
})

# ================================================================ 6 kuan-chua
etapy.append({
 "id": "kuan-chua",
 "doba": L("1324 – 1911", "1324 – 1911"),
 "pohled": [111, 31, 1.8],
 "nazev": L("Kuan-chua – řeč úředníků", "Guanhua – the speech of officials"),
 "text": L(
  "Roku 1324 zachytil Čou Te-čching v rýmové knize Čung-jüan jin-jün severní výslovnost, v níž už starý vstupní tón splynul s ostatními tóny; jazyk této doby se nazývá stará mandarínština. Za dynastií Ming (1368–1644) a Čching (1644–1911) se úředníci z různých provincií, jejichž rodné řeči si navzájem nerozuměly, dorozumívali kuan-chua (官话), „řečí úředníků“; podle úředníků, které Portugalci nazývali mandarim, dostala v evropských jazycích jméno mandarínština. Roku 1421 přenesl císař Jung-le hlavní město z Nan-ťingu do Pej-ťingu, podle W. South Coblina však kuan-chua ještě dlouho vycházela spíš z řeči kolem Nan-ťingu a k pekingské výslovnosti se přiklonila až v 19. století. Císař Jung-čeng roku 1728 nařídil, aby se úředníci z Fu-ťienu a Kuang-tungu učili správné výslovnosti, a vznikly k tomu akademie čeng-jin šu-jüan. Mingská vojska a osadníci, kteří od let 1381–1382 přicházeli do Jün-nanu a Kuej-čou, přinesli na jihozápad severní čínštinu, z níž se vyvinula jihozápadní mandarínština. Vedle klasické čínštiny se psalo i v paj-chua (白话), psaném jazyce blízkém mluvené severní řeči: v něm vznikly romány Příběhy od jezera a Putování na západ (oba známé z vydání 16. století) a Sen v červeném domě (18. století).",
  "In 1324 Zhou Deqing recorded in his rhyme book Zhongyuan yinyun a northern pronunciation in which the old entering tone had already merged with the other tones; the language of this period is called Old Mandarin. Under the Ming (1368–1644) and Qing (1644–1911) dynasties, officials from different provinces, whose native speech was mutually unintelligible, communicated in guanhua (官话), ‘the speech of officials’; it was named Mandarin in European languages after the officials whom the Portuguese called mandarim. In 1421 the Yongle Emperor moved the capital from Nanjing to Beijing, but according to W. South Coblin guanhua long remained closer to the speech of the Nanjing area and turned to Beijing pronunciation only in the 19th century. In 1728 the Yongzheng Emperor ordered officials from Fujian and Guangdong to learn correct pronunciation, and academies (zhengyin shuyuan) were set up for the purpose. Ming soldiers and settlers, who arrived in Yunnan and Guizhou from 1381–1382, brought northern Chinese to the south-west, where it developed into South-western Mandarin. Besides Classical Chinese, people also wrote in baihua (白话), a written language close to northern speech: it was used for the novels Water Margin and Journey to the West (both known from 16th-century editions) and Dream of the Red Chamber (18th century)."),
 "oblasti": [
  O("kuan-chua", [(116.4, 39.9, 0.9), (118.8, 32.1, 0.6), (114.4, 34.8, 0.9), (108.9, 34.3, 0.8), (114.3, 30.7, 0.6), (117.0, 36.6, 0.8), (123.4, 41.8, 0.8)], "zhn",
    L("kuan-chua (mandarínština)", "guanhua (Mandarin)")),
  O("jihozapad", [(104.1, 30.7, 0.75), (106.6, 29.6, 0.6), (106.7, 26.6, 0.55), (102.7, 25.0, 0.65)], "zhn",
    L("jihozápadní mandarínština", "South-western Mandarin"), po="do-jun-nanu"),
  O("wu", [(120.3, 30.2, 0.55), (120.6, 31.4, 0.45)], "wu", L("wu", "Wu")),
  O("min", [(119.3, 26.1, 0.5), (118.1, 24.7, 0.5)], "min", L("min", "Min")),
  O("jue", [(113.3, 23.1, 0.6), (110.3, 22.6, 0.45)], "yue", L("jüe", "Yue")),
  O("hakka", [(116.1, 24.3, 0.45)], "hak", L("hakka", "Hakka")),
  O("kan", [(115.9, 28.6, 0.55)], "gan", L("kan", "Gan")),
  O("siang", [(112.9, 28.0, 0.55)], "xia", L("siang", "Xiang")),
 ],
 "proudy": [
  P("do-pej-tingu", [(118.8, 32.1), (119.0, 33.6), (117.4, 34.4), (116.2, 35.6), (115.8, 36.9), (116.6, 38.4), (116.4, 39.8)], "zhn",
    L("hlavní město do Pej-ťingu (1421)", "capital moves to Beijing (1421)")),
  P("do-jun-nanu", [(118.6, 31.9), (116.4, 30.6), (114.3, 30.6), (112.0, 29.3), (109.6, 27.6), (106.8, 26.6), (104.2, 25.6), (102.8, 25.05)], "zhn",
    L("do Jün-nanu (1381–1382)", "to Yunnan (1381–1382)")),
 ]
})

# ================================================================ 7 do světa
etapy.append({
 "id": "do-sveta",
 "doba": L("17. – počátek 20. století", "17th – early 20th century"),
 "pohled": [168, 6, 0.9],
 "nazev": L("Do světa", "Out into the world"),
 "text": L(
  "Od 17. století odcházely z jižních přístavů Fu-ťienu a Kuang-tungu nejprve statisíce, později miliony lidí. Na Tchaj-wan připlouvali osadníci z Fu-ťienu a z hakkských krajů už za nizozemské vlády (1624–1662), za Čeng Čcheng-kunga a jeho nástupců a po roce 1683 za dynastie Čching; jazyky austronéských obyvatel nížin postupně zanikaly a austronéské jazyky se udržely hlavně v horách a na východě ostrova. Do jihovýchodní Asie, kterou Číňané nazývali Nan-jang („Jižní moře“), odcházeli obchodníci a dělníci do Manily, Batávie, Bangkoku, na Malajský poloostrov a do Singapuru, založeného jako britský přístav roku 1819. Po roce 1848 se z delty Perlové řeky, hlavně z okresů S'-i kolem Tchaj-šanu, vydávaly tisíce mužů za zlatem do Kalifornie, kde v letech 1865–1869 tvořili čínští dělníci většinu pracovníků na stavbě železnice Central Pacific, a v 50. letech do australské Viktorie; kvůli vstupní dani tam v letech 1857–1863 přistálo přes 16 tisíc lidí v Robe v Jižní Austrálii a pokračovali pěšky na zlatá pole. Přes čtvrt milionu smluvních dělníků bylo v letech 1847–1874 přepraveno na Kubu a do Peru. Spojené státy zákonem z roku 1882 příchod čínských dělníků zakázaly. Vystěhovalci mluvili hlavně jižními jazyky: hokkienem (min), čchao-čouštinou, kantonštinou a hakka; mandarínština se v diaspoře rozšířila až ve 20. století.",
  "From the 17th century first hundreds of thousands and later millions of people left the southern ports of Fujian and Guangdong. Settlers from Fujian and from the Hakka districts sailed to Taiwan as early as the Dutch period (1624–1662), under Zheng Chenggong (Koxinga) and his successors, and after 1683 under the Qing dynasty; the languages of the Austronesian lowland peoples gradually died out, and Austronesian languages survived mainly in the mountains and on the east of the island. To South-East Asia, which the Chinese called Nanyang (‘the Southern Ocean’), merchants and labourers went to Manila, Batavia, Bangkok, the Malay Peninsula and Singapore, founded as a British port in 1819. After 1848 thousands of men from the Pearl River Delta, mainly from the Siyi counties around Taishan, set out for the gold of California, where in 1865–1869 Chinese labourers made up most of the workforce building the Central Pacific Railroad, and in the 1850s for the Australian colony of Victoria; to avoid its entry tax, more than 16,000 people landed at Robe in South Australia in 1857–1863 and walked on to the goldfields. More than a quarter of a million contract labourers were shipped to Cuba and Peru in 1847–1874. In 1882 the United States barred Chinese labourers by law. The emigrants spoke mainly southern languages – Hokkien (Min), Teochew, Cantonese and Hakka; Mandarin spread in the diaspora only in the 20th century."),
 "oblasti": [
  O("tchaj-wan", [(120.25, 23.1, 0.45), (120.65, 24.15, 0.4), (121.45, 25.0, 0.3)], "min",
    L("Tchaj-wan: min a hakka", "Taiwan: Min and Hakka"), po="na-tchaj-wan"),
  O("austronesane", [(121.2, 23.5, 0.35), (120.95, 22.6, 0.3)], "an",
    L("austronéské jazyky", "Austronesian languages")),
  O("manila", [(121.0, 14.6, 0.45)], "hq", L("Manila", "Manila"), po="do-manily"),
  O("bangkok", [(100.5, 13.8, 0.5)], "hq", L("Bangkok", "Bangkok"), po="do-bangkoku"),
  O("malajsko", [(103.82, 1.36, 0.3), (101.7, 3.1, 0.45), (100.45, 5.4, 0.3)], "hq",
    L("Singapur a Malajsko", "Singapore and Malaya"), po="do-singapuru"),
  O("batavie", [(106.8, -6.25, 0.4)], "hq", L("Batávie", "Batavia"), po="do-batavie"),
  O("kalifornie", [(-121.4, 38.6, 0.7), (-122.2, 37.8, 0.35)], "hq", L("Kalifornie", "California"), po="do-kalifornie"),
  O("viktorie", [(143.85, -37.55, 0.55), (144.3, -36.8, 0.45), (142.95, -37.3, 0.35)], "hq",
    L("Viktorie (Austrálie)", "Victoria (Australia)"), po="pesky-na-pole"),
 ],
 "proudy": [
  P("na-tchaj-wan", [(118.1, 24.45), (118.25, 24.3), (118.9, 23.85), (119.25, 23.15), (119.8, 22.95), (120.15, 23.0), (120.22, 23.0)], "min",
    L("na Tchaj-wan (17. st.)", "to Taiwan (17th c.)")),
  P("do-manily", [(118.1, 24.45), (118.3, 24.25), (118.9, 22.8), (119.4, 20.5), (119.8, 18.2), (119.6, 16.4), (119.9, 14.7), (120.4, 14.28), (120.66, 14.36), (120.9, 14.55), (120.98, 14.59), (121.0, 14.6)], "hq",
    L("do Manily", "to Manila")),
  P("do-bangkoku", [(116.68, 23.36), (116.9, 23.0), (115.0, 21.6), (113.0, 20.1), (111.6, 17.4), (110.0, 14.5), (109.8, 12.0), (108.0, 9.4), (105.3, 7.9), (103.0, 9.6), (101.0, 11.6), (100.5, 12.5), (100.5, 13.3), (100.55, 13.52), (100.5, 13.75)], "hq",
    L("do Bangkoku", "to Bangkok")),
  P("do-singapuru", [(114.16, 22.25), (114.165, 22.2), (114.2, 21.9), (113.4, 20.0), (111.8, 16.8), (110.4, 12.0), (108.4, 8.0), (105.5, 4.4), (104.6, 1.4), (104.1, 1.2), (103.88, 1.25), (103.85, 1.3), (103.84, 1.33)], "hq",
    L("do Singapuru", "to Singapore")),
  P("do-penangu", [(103.72, 1.2), (103.4, 1.15), (102.6, 1.85), (101.4, 2.7), (100.7, 3.8), (100.2, 5.0), (100.25, 5.35)], "hq",
    L("na Penang", "to Penang")),
  P("do-batavie", [(103.9, 1.22), (104.6, 1.3), (105.1, 1.0), (105.6, 0.0), (107.2, -2.0), (107.35, -2.8), (107.2, -3.6), (107.0, -5.2), (106.85, -6.05), (106.82, -6.15)], "hq",
    L("do Batávie", "to Batavia")),
  P("do-kalifornie", [(114.16, 22.25), (114.165, 22.2), (114.32, 22.15), (114.6, 21.9), (117.5, 21.4), (121.3, 21.3), (124.0, 23.0), (126.5, 25.2), (128.0, 27.4), (131.5, 30.2), (135.5, 32.8), (138.9, 34.45), (139.6, 34.55), (140.3, 34.7), (145.0, 36.0), (155.0, 40.5), (165.0, 44.0), (180.0, 46.5), (-165.0, 46.8), (-150.0, 45.0), (-138.0, 42.0), (-128.0, 39.0), (-123.3, 37.75), (-122.5, 37.81), (-122.42, 37.8), (-122.42, 37.77)], "hq",
    L("do Kalifornie (od 1848)", "to California (from 1848)")),
  P("do-australie", [(114.16, 22.25), (114.165, 22.2), (114.32, 22.15), (114.6, 21.9), (117.5, 21.4), (120.6, 21.5), (121.6, 21.5), (123.0, 21.0), (125.0, 18.0), (128.5, 12.0), (132.0, 6.0), (137.0, 2.0), (145.0, 0.0), (152.0, -1.5), (158.0, -3.5), (163.5, -6.0), (163.0, -12.0), (162.0, -20.0), (158.0, -26.0), (153.5, -31.5), (151.0, -36.0), (149.8, -38.0), (148.0, -38.6), (146.4, -39.45), (144.5, -39.1), (142.5, -38.75), (141.0, -38.45), (140.3, -38.15), (139.55, -37.45), (139.7, -37.17), (139.76, -37.16), (139.8, -37.17)], "hq",
    L("do Austrálie (50. léta 19. st.)", "to Australia (1850s)")),
  P("pesky-na-pole", [(139.8, -37.17), (140.84, -37.38), (141.4, -37.58), (142.04, -37.52), (142.35, -37.65), (142.93, -37.28), (143.85, -37.56)], "hq",
    L("pěšky na zlatá pole", "on foot to the goldfields")),
 ]
})

# ================================================================ 8 spisovný jazyk 20. století
etapy.append({
 "id": "spisovny",
 "doba": L("1917 – 1979", "1917 – 1979"),
 "pohled": [113, 22, 1.4],
 "nazev": L("Spisovný jazyk 20. století", "A standard language for the 20th century"),
 "text": L(
  "Na počátku 20. století se klasická čínština stala terčem reformátorů. Roku 1917 vyzval Chu Š' v časopise Nové mládí (Sin čching-nien) k literatuře v paj-chua, Lu Sün roku 1918 vydal v hovorovém jazyce povídku Deník šílence a hnutí 4. května 1919 dalo celému proudu jméno. Roku 1920 nařídilo ministerstvo školství Čínské republiky, aby se v prvních dvou ročnících základních škol místo klasické čínštiny učil psaný jazyk blízký mluvené řeči. Spisovný mluvený jazyk se nazýval kuo-jü (国语, „národní jazyk“), od roku 1918 měl hláskové písmo ču-jin a od roku 1932 jako normu pekingskou výslovnost. Čínská lidová republika jej v únoru 1956 vymezila jako pchu-tchung-chua (普通话, „obecná řeč“): pekingská výslovnost, severní nářečí jako základ a vzorová díla moderní paj-chua jako mluvnická norma. Roku 1956 zavedla první zjednodušené znaky (souhrnný seznam 1964) a 11. února 1958 schválilo Všečínské shromáždění lidových zástupců přepis pinyin. Na Tchaj-wanu, který Čínská republika převzala od Japonska roku 1945 a kam se roku 1949 přesunula její vláda, se prosazoval kuo-jü a zůstaly tradiční znaky; v Hongkongu a Macau převládala kantonština. V Singapuru, který v letech 1969–1976 zavedl zjednodušené znaky, zahájila vláda roku 1979 kampaň Speak Mandarin, aby Číňané místo jižních jazyků užívali mandarínštinu.",
  "In the early 20th century Classical Chinese became a target of reformers. In 1917 Hu Shi called in the magazine New Youth (Xin qingnian) for literature in baihua, in 1918 Lu Xun published his story A Madman’s Diary in the vernacular, and the May Fourth Movement of 1919 gave the whole current its name. In 1920 the Ministry of Education of the Republic of China ordered that the first two years of primary school should teach a written language close to speech instead of Classical Chinese. The spoken standard was called guoyu (国语, ‘national language’); from 1918 it had a phonetic script, zhuyin, and from 1932 Beijing pronunciation as its norm. In February 1956 the People’s Republic of China defined it as putonghua (普通话, ‘common speech’): Beijing pronunciation, the northern dialects as its base and model works of modern baihua as its grammatical norm. In 1956 the PRC introduced the first simplified characters (with a consolidated list in 1964), and on 11 February 1958 the National People’s Congress approved the pinyin romanisation. In Taiwan, which the Republic of China took over from Japan in 1945 and to which its government moved in 1949, guoyu was promoted and traditional characters remained in use; in Hong Kong and Macau Cantonese prevailed. In Singapore, which introduced simplified characters in 1969–1976, the government launched the Speak Mandarin Campaign in 1979 to encourage Chinese Singaporeans to use Mandarin instead of southern languages."),
 "oblasti": [
  O("pchu-tchung-chua", [(116.4, 39.9, 1.0), (114.4, 34.8, 1.0), (108.9, 34.3, 0.9), (118.8, 32.1, 0.7), (114.3, 30.6, 0.8), (104.1, 30.7, 0.8), (123.4, 41.8, 0.9), (126.6, 45.75, 0.9)], "zhn",
    L("pchu-tchung-chua", "Putonghua")),
  O("tchaj-wan", [(121.45, 25.0, 0.35), (120.65, 23.9, 0.45), (120.35, 22.8, 0.3)], "zhn",
    L("kuo-jü (Tchaj-wan)", "Guoyu (Taiwan)"), po="na-tchaj-wan"),
  O("hongkong", [(114.1, 22.4, 0.4)], "yue",
    L("kantonština (Hongkong, Macao)", "Cantonese (Hong Kong, Macau)")),
  O("singapur", [(103.82, 1.36, 0.3)], "zhn",
    L("Singapur (Speak Mandarin, 1979)", "Singapore (Speak Mandarin, 1979)")),
 ],
 "proudy": [
  P("na-tchaj-wan", [(121.5, 31.2), (121.9, 31.0), (122.6, 30.8), (123.0, 29.5), (122.6, 27.0), (122.0, 25.6), (121.74, 25.14), (121.72, 25.1)], "zhn",
    L("na Tchaj-wan (1945–1949)", "to Taiwan (1945–1949)")),
 ]
})

# ================================================================ 9 dnes
etapy.append({
 "id": "dnes",
 "doba": L("dnes", "today"),
 "pohled": [110, 30, 1.5],
 "nazev": L("Čínské jazyky dnes", "Chinese languages today"),
 "text": L(
  "Čínskými jazyky dnes mluví zhruba 1,2 až 1,3 miliardy lidí. Největší skupinou je mandarínština: je mateřštinou asi 940 až 990 milionů lidí, s nerodilými mluvčími jí mluví přes 1,1 miliardy a je jazykem s nejvíce rodilými mluvčími na světě (odhady se podle zdroje a vydání liší). Jazykový atlas Číny (2. vydání, 2012) rozlišuje vedle mandarínštiny devět skupin: ťin, wu, chuej, kan, siang, min, jüe, pching-chua a hakka; zda jsou ťin a pching-chua samostatné skupiny, je sporné. Pchu-tchung-chua je podle zákona z roku 2000 (novelizovaného 2025) společným jazykem Čínské lidové republiky a podle ministerstva školství ji v roce 2020 ovládalo 80,72 % obyvatel, proti 53,06 % v roce 2000; zákon zároveň uznává právo národností užívat a rozvíjet vlastní jazyky. Studie z velkých měst, jako je Šanghaj, ukazují, že mladí lidé místní varietou mluví méně a méně plynně než starší generace. Na Tchaj-wanu je mandarínština hlavním jazykem úřadů a škol a zákony z let 2017–2019 uznaly za národní jazyky i tchajwanštinu (min), hakka a austronéské jazyky ostrova. V Singapuru je mandarínština jedním ze čtyř úředních jazyků, v Hongkongu a Macau převládá kantonština. Čínské znění Charty OSN je jedním z pěti rovnocenných a čínština je od roku 1973 také pracovním jazykem Valného shromáždění.",
  "Today roughly 1.2 to 1.3 billion people speak Chinese languages. The largest group is Mandarin: it is the mother tongue of some 940 to 990 million people, more than 1.1 billion speak it including second-language speakers, and it is the language with the most native speakers in the world (estimates vary between sources and editions). The Language Atlas of China (2nd edition, 2012) distinguishes nine groups besides Mandarin: Jin, Wu, Hui, Gan, Xiang, Min, Yue, Pinghua and Hakka; whether Jin and Pinghua are separate groups is disputed. Under a law of 2000 (revised in 2025) Putonghua is the common language of the People’s Republic of China, and according to the Ministry of Education 80.72 per cent of the population could speak it in 2020, against 53.06 per cent in 2000; the same law recognises the right of ethnic groups to use and develop their own languages. Studies from large cities such as Shanghai show that young people speak the local variety less, and less fluently, than older generations. In Taiwan Mandarin is the main language of government and schools, and laws passed in 2017–2019 recognised Taiwanese (Min), Hakka and the island’s Austronesian languages as national languages as well. In Singapore Mandarin is one of four official languages; in Hong Kong and Macau Cantonese predominates. The Chinese text of the UN Charter is one of its five equally authentic versions, and since 1973 Chinese has also been a working language of the General Assembly."),
 "oblasti": [
  O("mandarinstina", [(116.4, 39.9, 1.1), (114.4, 34.8, 1.0), (108.9, 34.3, 0.9), (118.8, 32.3, 0.6), (114.3, 30.7, 0.65), (117.0, 36.6, 0.8), (123.4, 41.8, 0.9), (126.6, 45.75, 0.9), (103.8, 36.1, 0.8), (104.1, 30.7, 0.75), (106.6, 29.6, 0.6), (106.7, 26.6, 0.55), (102.7, 25.0, 0.65), (87.6, 43.8, 0.7)], "zhn",
    L("mandarínština", "Mandarin")),
  O("wu", [(120.3, 30.2, 0.55), (120.6, 31.4, 0.45), (121.4, 31.15, 0.3)], "wu", L("wu (šanghajština)", "Wu (Shanghainese)")),
  O("min", [(119.3, 26.1, 0.5), (118.1, 24.7, 0.5), (116.6, 23.4, 0.35), (110.3, 19.9, 0.4)], "min", L("min (hokkien)", "Min (Hokkien)")),
  O("jue", [(113.3, 23.1, 0.6), (110.3, 22.6, 0.45), (114.1, 22.4, 0.3)], "yue", L("jüe (kantonština)", "Yue (Cantonese)")),
  O("hakka", [(116.1, 24.3, 0.45)], "hak", L("hakka", "Hakka")),
  O("kan", [(115.9, 28.6, 0.55)], "gan", L("kan", "Gan")),
  O("siang", [(112.9, 28.0, 0.55)], "xia", L("siang", "Xiang")),
  O("tchaj-wan", [(121.45, 25.0, 0.35), (120.65, 23.9, 0.45), (120.35, 22.8, 0.3)], "zhn",
    L("Tchaj-wan", "Taiwan")),
  O("tibet", [(91.0, 30.0, 1.5), (95.5, 32.3, 1.1), (99.5, 34.6, 0.8)], "tb",
    L("tibetské jazyky", "Tibetic languages")),
 ],
 "proudy": []
})

data = {
 "id": "cinstina",
 "atlas": "zh",
 "adresa": {"cs": "putovani-cinstina", "en": "journey-chinese", "it": "viaggio-cinese", "de": "reise-chinesisch", "fr": "voyage-chinois"},
 "nazev": L("Putování čínštiny", "The journey of Chinese"),
 "podtitul": L("Od prasinotibetštiny na Žluté řece k jazyku s nejvíce rodilými mluvčími na světě",
               "From Proto-Sino-Tibetan on the Yellow River to the language with the most native speakers in the world"),
 "uvod": L(
  "Jak se z řeči zemědělců na Žluté řece stala čínština, proč se v Číně mluví mnoha varietami, které si navzájem nerozumějí, jak čínské písmo a klasická čínština ovlivnily Koreu, Japonsko a Vietnam, jak se jižní čínské jazyky dostaly do jihovýchodní Asie, Ameriky a Austrálie a jak vznikla dnešní spisovná mandarínština. Letopočty nejstarších období jsou přibližné.",
  "How the speech of farmers on the Yellow River became Chinese, why China has many varieties that are mutually unintelligible, how Chinese writing and Classical Chinese shaped Korea, Japan and Vietnam, how the southern Chinese languages reached South-East Asia, America and Australia, and how today’s standard Mandarin came about. Dates for the earliest periods are approximate."),
 "etapy": etapy,
 "zdroje": [
  "Zhang, M., Yan, S., Pan, W., Jin, L. (2019): Phylogenetic evidence for Sino-Tibetan origin in northern China in the Late Neolithic. Nature 569, 112–115.",
  "Sagart, L., Jacques, G., Lai, Y., Ryder, R. J., Thouzeau, V., Greenhill, S. J., List, J.-M. (2019): Dated language phylogenies shed light on the ancestry of Sino-Tibetan. PNAS 116 (21), 10317–10322.",
  "LaPolla, R. J. (2019): The origin and spread of Sino-Tibetan languages. Nature 569 (News & Views), doi:10.1038/d41586-019-01214-6.",
  "van Driem, G. (2014): Trans-Himalayan. In: Owen-Smith, T., Hill, N. W. (eds.): Trans-Himalayan Linguistics. Berlin – Boston: De Gruyter Mouton, 11–40.",
  "Norman, J. (1988): Chinese. Cambridge: Cambridge University Press (Cambridge Language Surveys).",
  "Baxter, W. H., Sagart, L. (2014): Old Chinese: A New Reconstruction. Oxford: Oxford University Press.",
  "Liu, K. et al. (2021): Radiocarbon dating of oracle bones of Late Shang period in ancient China. Radiocarbon 63 (1), 155–175.",
  "Keightley, D. N. (1978): Sources of Shang History: The Oracle-Bone Inscriptions of Bronze Age China. Berkeley: University of California Press.",
  "Qiu, X. (2000): Chinese Writing. Transl. G. L. Mattos and J. Norman. Berkeley: Society for the Study of Early China.",
  "Galambos, I. (2004): The myth of the Qin unification of writing in Han sources. Acta Orientalia Academiae Scientiarum Hungaricae 57 (2), 181–203.",
  "Coblin, W. S. (2000): A brief history of Mandarin. Journal of the American Oriental Society 120 (4), 537–552.",
  "Kornicki, P. F. (2018): Languages, Scripts, and Chinese Texts in East Asia. Oxford: Oxford University Press.",
  "Leong, S.-T. (1997): Migration and Ethnicity in Chinese History: Hakkas, Pengmin, and Their Neighbors. Stanford: Stanford University Press.",
  "Herman, J. E. (2007): Amid the Clouds and Mist: China’s Colonization of Guizhou, 1200–1700. Cambridge, Mass.: Harvard University Asia Center.",
  "Andrade, T. (2008): How Taiwan Became Chinese: Dutch, Spanish, and Han Colonization in the Seventeenth Century. New York: Columbia University Press.",
  "Kuhn, P. A. (2008): Chinese Among Others: Emigration in Modern Times. Lanham: Rowman & Littlefield.",
  "Meagher, A. J. (2008): The Coolie Trade: The Traffic in Chinese Laborers to Latin America 1847–1874. Bloomington: Xlibris.",
  "Chen, P. (1999): Modern Chinese: History and Sociolinguistics. Cambridge: Cambridge University Press.",
  "Chinese Academy of Social Sciences et al. (2012): 中国语言地图集 汉语方言卷 (Language Atlas of China: Chinese Dialects). 2nd ed. Beijing: Commercial Press.",
  "Ministry of Education of the PRC (2021): 2020年中国语言文字事业发展状况 (report on the state of language work in China, 2020). Beijing.",
  "Singapore Department of Statistics (2021): Census of Population 2020, Statistical Release 1. Singapore."
 ]
}

json.dump(data, open(sys.argv[1], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('zapsano')
