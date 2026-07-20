import React from "react";
import Seo from "../components/Seo";
import "./AboutStory.css";

function AboutStory() {
  return (
    <div className="aboutStoryPage">
      <Seo
        title="Notre histoire"
        description="L'histoire d'Aurassens, née sur les routes du Québec."
        path="/notre-histoire"
      />
      <div className="aboutStoryCard">
        <h1>Notre histoire</h1>

        <p>
          L'idée d'Aurassens n'est pas née dans un bureau. Elle est née sur la route,
          entre deux livraisons.
        </p>

        <p>
          Pendant un moment de ma vie, j'ai travaillé comme chauffeur-livreur pour
          plusieurs compagnies au Québec. Ce métier m'a fait entrer dans des centaines
          de maisons, partout, tous les jours. Et j'ai remarqué un petit détail qui m'est
          resté en tête : beaucoup de ces demeures avaient une odeur... disons, pas très
          agréable. Rien de dramatique, juste ce genre de détail qu'on ne remarque pas
          soi-même, mais qui change complètement l'ambiance d'un chez-soi.
        </p>

        <p>
          C'est là que l'idée a commencé à germer : et si je pouvais aider les gens à
          améliorer un peu leur quotidien, une odeur à la fois? Pas juste vendre un
          parfum, mais offrir une meilleure vie, un peu plus de bien-être à la maison.
        </p>

        <p>
          Puis en janvier 2026 est arrivée ma résolution du nouvel an — comme tant
          d'autres, sauf que celle-là, je l'ai vraiment prise au sérieux. Développeur
          dans l'âme, je voulais construire quelque chose qui allait au-delà du code :
          une vraie marque, un vrai produit, quelque chose que des gens pourraient
          tenir dans leurs mains.
        </p>

        <p>
          Et puis... la vie a repris ses droits. Les études, le travail, les imprévus.
          Un mois après avoir lancé le projet, je l'ai mis de côté. Pas par manque de
          passion, mais parce que parfois, il faut savoir respirer avant de continuer.
        </p>

        <p>
          Six mois plus tard, Aurassens était toujours là, quelque part dans un coin
          de ma tête. Alors j'ai rouvert le projet, et cette fois, je suis allé jusqu'au
          bout.
        </p>

        <p>
          Aujourd'hui, ce site est bien plus qu'une application que j'ai codée — c'est
          mon premier vrai bébé. Chaque ligne, chaque détail, chaque parfum que vous
          voyez ici est passé par mes mains, avec toute l'énergie d'un projet qu'on a
          failli abandonner mais qu'on a choisi de terminer.
        </p>

        <p>
          Je suis fier de vous le présenter, mais je sais aussi qu'il y a encore du
          chemin à faire. Alors n'hésitez surtout pas à m'écrire — vos critiques (même
          les plus franches), vos idées de fonctionnalités, ou les produits que vous
          aimeriez voir apparaître ici. Ce projet grandit aussi grâce à vous.
        </p>

        <p className="aboutStoryContact">
          <a href="mailto:contact@aurassens.shop">contact@aurassens.shop</a>
        </p>
      </div>
    </div>
  );
}

export default AboutStory;
