import React from "react";
import Seo from "./Seo";
import "./DataPolicy.css";

function DataPolicy() {
  return (
    <div className="privacyPolicyPage">
      <Seo
        title="Politique de confidentialité"
        description="Politique de confidentialité d'Aurassens — Loi 25 et PIPEDA."
        path="/politique-confidentialite"
      />
      <h1>Politique de confidentialité — Aurassens</h1>
      <p className="policyUpdated"><strong>Dernière mise à jour :</strong> 19 juillet 2026</p>

      <p>
        Aurassens (ci-après « nous », « notre » ou « l'entreprise ») exploite le site web{" "}
        <a href="https://aurassens.shop">aurassens.shop</a>. Cette politique explique quelles
        données personnelles nous collectons, pourquoi, comment elles sont utilisées, et quels
        sont vos droits.
      </p>
      <p>
        Aurassens est une entreprise individuelle en démarrage, basée au Québec. Cette politique
        est rédigée conformément à la <strong>Loi 25</strong> (Loi modernisant des dispositions
        législatives en matière de protection des renseignements personnels, Québec) et à la{" "}
        <strong>PIPEDA</strong> (Loi sur la protection des renseignements personnels et les
        documents électroniques, fédérale).
      </p>

      <h2>1. Quelles données nous collectons</h2>
      <p>Selon votre utilisation du site, nous pouvons collecter :</p>
      <ul>
        <li><strong>Informations de compte</strong> : nom, adresse courriel</li>
        <li><strong>Informations de commande</strong> : adresse de livraison, adresse de facturation, historique des commandes</li>
        <li><strong>Informations de paiement</strong> : traitées et stockées directement par notre processeur de paiement (Stripe) — nous n'enregistrons ni ne stockons aucune information de paiement (numéro de carte, informations bancaires) sur nos serveurs</li>
        <li><strong>Informations de connexion via Google</strong> (si vous choisissez de vous connecter avec Google) : nom, adresse courriel — uniquement les informations de base fournies par Google, rien de plus</li>
        <li><strong>Données techniques de base</strong> : adresse IP, type de navigateur, pages visitées (pour le bon fonctionnement du site et la sécurité)</li>
      </ul>
      <p>
        Nous ne collectons pas plus de données que ce qui est nécessaire pour traiter votre
        commande et vous offrir un service client adéquat.
      </p>

      <h2>2. Pourquoi nous collectons ces données</h2>
      <ul>
        <li>Traiter et livrer vos commandes</li>
        <li>Vous envoyer des confirmations de commande et des mises à jour de livraison par courriel</li>
        <li>Vous permettre de créer un compte et de consulter votre historique de commandes</li>
        <li>Répondre à vos demandes de service client</li>
        <li>Assurer la sécurité et le bon fonctionnement du site</li>
      </ul>
      <p>
        Nous n'utilisons pas vos données à des fins de publicité ciblée par des tiers, et nous ne
        les vendons pas.
      </p>

      <h2>3. Connexion avec Google</h2>
      <p>
        Si vous utilisez l'option « Se connecter avec Google », nous recevons uniquement votre nom
        et votre adresse courriel, tels que fournis par Google. Ces informations servent
        uniquement à créer et identifier votre compte sur Aurassens. Nous ne demandons et
        n'utilisons aucun autre renseignement de votre compte Google.
      </p>

      <h2>4. Partage des données avec des tiers</h2>
      <p>
        Nous faisons appel à des sous-traitants de confiance pour certaines fonctions du site. Ces
        sous-traitants ont accès uniquement aux données nécessaires à l'exécution de leur
        service :
      </p>
      <ul>
        <li><strong>Stripe</strong> — traitement des paiements</li>
        <li><strong>Resend</strong> — envoi de courriels transactionnels (confirmations de commande, notifications)</li>
      </ul>
      <p>
        Ces fournisseurs sont tenus contractuellement de protéger vos données et ne peuvent les
        utiliser à d'autres fins que celles pour lesquelles ils sont mandatés.
      </p>
      <p>
        Nous ne partageons, ne louons ni ne vendons vos données personnelles à des fins
        commerciales ou publicitaires.
      </p>

      <h2>5. Durée de conservation</h2>
      <p>
        Nous conservons vos données personnelles aussi longtemps que nécessaire pour les finalités
        décrites ci-dessus, soit généralement <strong>3 ans après votre dernière activité</strong>{" "}
        sur votre compte (dernière commande ou dernière connexion), sauf si une période de
        conservation plus longue est exigée par la loi (ex. obligations fiscales ou comptables).
      </p>

      <h2>6. Vos droits</h2>
      <p>Conformément à la Loi 25 et à la PIPEDA, vous avez le droit de :</p>
      <ul>
        <li>Accéder aux renseignements personnels que nous détenons à votre sujet</li>
        <li>Demander la correction de renseignements inexacts</li>
        <li>Demander la suppression de votre compte et de vos données personnelles, sous réserve des obligations légales de conservation</li>
        <li>Retirer votre consentement à la collecte de vos données, dans la mesure où cela n'affecte pas des obligations contractuelles en cours (ex. commande en traitement)</li>
      </ul>
      <p>Pour exercer l'un de ces droits, contactez-nous à l'adresse indiquée à la section 8.</p>

      <h2>7. Sécurité</h2>
      <p>
        Nous prenons des mesures raisonnables pour protéger vos données personnelles contre
        l'accès non autorisé, la perte ou la divulgation, incluant le chiffrement des
        communications (HTTPS) et des pratiques de développement sécuritaires.
      </p>

      <h2>8. Nous contacter</h2>
      <p>
        Pour toute question concernant cette politique de confidentialité ou vos renseignements
        personnels, vous pouvez nous contacter à :{" "}
        <a href="mailto:support@aurassens.shop">support@aurassens.shop</a>
      </p>

      <h2>9. Modifications de cette politique</h2>
      <p>
        Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. La date de
        la dernière mise à jour sera toujours indiquée en haut de ce document. Nous vous
        encourageons à consulter cette page périodiquement.
      </p>
    </div>
  );
}

export default DataPolicy;
