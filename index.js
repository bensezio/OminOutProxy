import "@lwc/synthetic-shadow";
import { buildCustomElementConstructor } from "lwc";

/**
 * Here you can import the component(s) that you will export as Web Component.
 * You can import one or more components using the format `namespace/component`.
 */
import MotorRenewalVlocApp from "vlocityomniscript/atlasDXMotorRenewalSelfServiceEnglish";
import TravelQuoteVlocApp from "vlocityomniscript/atlasDXTravelQuoteEnglish";
import QuoteDocumentationVlocApp from "vlocityomniscript/atlasDXQuoteDocumentation_LWCEnglish";

const availableFeature = detectFeatures();
const isCompatibleBrowser = Object.keys(availableFeature).some(
  (feature) => !availableFeature[feature]
);

if (isCompatibleBrowser) {
  unsupportedErrorMessage(availableFeature);
} else {
  /**
   * Here you can define the components that will be exported as Web Components.
   * This example  uses the component located in `vlocityomniscript/typeExampleSubtypeExampleEnglish`
   * and exports the component by following the LWC naming convention.
   */

  customElements.define("vlocityomniscript-atlas-d-x-motor-renewal-self-service-english", MotorRenewalVlocApp.CustomElementConstructor);
  customElements.define("vlocityomniscript-atlas-d-x-travel-quote-english", TravelQuoteVlocApp.CustomElementConstructor);
  customElements.define("vlocityomniscript-atlas-d-x-quote-documentation_-l-w-c-english", QuoteDocumentationVlocApp.CustomElementConstructor);
}

function detectFeatures() {
  return {
    "Service Worker": "serviceWorker" in navigator,
  };
}

function unsupportedErrorMessage() {
  const { outdated } = window;
  outdated.style.display = "unset";

  let message = `This browser doesn't support all the required features`;

  message += `<ul>`;
  for (const [name, available] of Object.entries(availableFeature)) {
    message += `<li><b>${name}:<b> ${available ? "✅" : "❌"}</li>`;
  }
  message += `</ul>`;

  // eslint-disable-next-line @lwc/lwc/no-inner-html
  outdated.querySelector(".unsupported_message").innerHTML = message;
}