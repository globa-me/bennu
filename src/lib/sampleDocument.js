export const sampleDocument = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Bennu Demo Document</title>
    <style>
      :root {
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #17201d;
        background: #f6f8f7;
      }

      body {
        margin: 0;
        background: #f6f8f7;
      }

      .page {
        max-width: 1080px;
        margin: 0 auto;
        padding: 48px 32px 72px;
      }

      .hero {
        display: grid;
        grid-template-columns: 1.05fr 0.95fr;
        gap: 32px;
        align-items: center;
        min-height: 520px;
      }

      h1 {
        margin: 0 0 18px;
        font-size: clamp(44px, 7vw, 76px);
        line-height: 0.95;
        letter-spacing: 0;
      }

      p {
        color: #51615c;
        font-size: 18px;
        line-height: 1.7;
      }

      .button {
        display: inline-flex;
        align-items: center;
        margin-top: 16px;
        padding: 13px 18px;
        border-radius: 8px;
        background: #0f766e;
        color: white;
        text-decoration: none;
        font-weight: 700;
      }

      .photo {
        width: 100%;
        aspect-ratio: 4 / 3;
        object-fit: cover;
        border-radius: 18px;
        box-shadow: 0 24px 60px rgba(17, 24, 39, 0.15);
      }

      .features {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-top: 42px;
      }

      .feature {
        padding: 22px;
        border: 1px solid #dce4e1;
        border-radius: 12px;
        background: white;
      }

      .feature h2 {
        margin: 0 0 8px;
        font-size: 20px;
      }

      .feature p {
        margin: 0;
        font-size: 15px;
      }

      @media (max-width: 780px) {
        .hero,
        .features {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <div>
          <h1>Edit this page directly in Bennu.</h1>
          <p>Click text, images, buttons, or sections in the preview. Change content and layout without jumping between source code and a browser.</p>
          <a class="button" href="#features">Start editing</a>
        </div>
        <img class="photo" alt="Abstract Bennu workspace" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 900'%3E%3Crect width='1200' height='900' fill='%23dcece8'/%3E%3Ccircle cx='875' cy='235' r='168' fill='%23f2c84b'/%3E%3Cpath d='M0 670 Q250 470 520 650 T1200 560 V900 H0Z' fill='%230f766e'/%3E%3Cpath d='M170 650 Q410 270 760 600 Q535 490 310 720Z' fill='%2317201d'/%3E%3Ctext x='82' y='138' font-family='Arial,sans-serif' font-size='54' font-weight='700' fill='%2317201d'%3EBennu workspace%3C/text%3E%3C/svg%3E">
      </section>

      <section class="features" id="features">
        <article class="feature">
          <h2>Live text</h2>
          <p>Type on the page and export the changed HTML when the document is ready.</p>
        </article>
        <article class="feature">
          <h2>Images</h2>
          <p>Select an image, paste a new source, or load a local replacement as a data URL.</p>
        </article>
        <article class="feature">
          <h2>Layout</h2>
          <p>Tune spacing, width, alignment, and visibility from the inspector.</p>
        </article>
      </section>
    </main>
  </body>
</html>`;

export function getSampleDocument(language = "en") {
  if (language !== "ru") return sampleDocument;
  return sampleDocument
    .replace("Bennu Demo Document", "Демонстрационная страница Bennu")
    .replace(
      "Edit this page directly in Bennu.",
      "Редактируйте эту страницу прямо в Bennu.",
    )
    .replace(
      "Click text, images, buttons, or sections in the preview. Change content and layout without jumping between source code and a browser.",
      "Нажимайте на текст, изображения, кнопки и блоки. Меняйте содержимое и макет, не переключаясь между кодом и браузером.",
    )
    .replace("Start editing", "Начать редактирование")
    .replace("Abstract Bennu workspace", "Рабочее пространство Bennu")
    .replace("Live text", "Живой текст")
    .replace(
      "Type on the page and export the changed HTML when the document is ready.",
      "Редактируйте текст на странице и экспортируйте готовый HTML.",
    )
    .replace(">Images<", ">Изображения<")
    .replace(
      "Select an image, paste a new source, or load a local replacement as a data URL.",
      "Выберите изображение, укажите новый адрес или загрузите локальную замену.",
    )
    .replace(">Layout<", ">Макет<")
    .replace(
      "Tune spacing, width, alignment, and visibility from the inspector.",
      "Настраивайте отступы, ширину, выравнивание и видимость через инспектор.",
    );
}
