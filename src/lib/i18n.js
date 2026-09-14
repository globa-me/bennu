export const DEFAULT_LANGUAGE = "en";

export const languages = Object.freeze({
  en: Object.freeze({
    code: "en",
    label: "English",
    nativeLabel: "English",
    htmlLang: "en",
  }),
  ru: Object.freeze({
    code: "ru",
    label: "Russian",
    nativeLabel: "Русский",
    htmlLang: "ru",
  }),
});

export const languageCodes = Object.freeze(Object.keys(languages));

export const dictionaries = Object.freeze({
  en: {
    common: {
      back: "Back",
      cancel: "Cancel",
      close: "Close",
      continue: "Continue",
      done: "Done",
      next: "Next",
      previous: "Previous",
      skip: "Skip",
      learnMore: "Learn more",
    },
    welcome: {
      eyebrow: "Visual HTML editor",
      title: "Edit a web page without sending it anywhere",
      description:
        "Open an HTML file, ZIP archive, or site folder. Bennu renders it in your browser so you can select content, make changes, and download the result.",
      languageTitle: "Choose your language",
      languageHint:
        "This sets the language for the tour and the whole app. You can change it later in Help.",
      localTitle: "Your project stays on this device",
      localBody:
        "Bennu has no project cloud or account. Files and edits are processed in this browser. A page may contact third-party sites only if you allow its external resources.",
      editTitle: "Click and edit",
      editBody:
        "Select text, images, links, or layout blocks in the preview and adjust them in the inspector.",
      exportTitle: "Download standard files",
      exportBody:
        "Take the finished work with you as HTML or a ZIP package that does not depend on Bennu.",
      openProject: "Open my project",
      tryDemo: "Try the demo",
      skip: "Skip introduction",
      dialogLabel: "Welcome to Bennu",
    },
    tour: {
      dialogLabel: "Bennu guided tour",
      progress: "Step {current} of {total}",
      open: {
        title: "Start with your files",
        body: "Open one HTML file, a ZIP package, or a site folder. The browser reads it locally.",
      },
      preview: {
        title: "Select what you want to change",
        body: "Click text, an image, a link, or a layout block in the preview. Its controls appear in the inspector.",
      },
      viewport: {
        title: "Check responsive widths",
        body: "Switch between desktop, tablet, mobile, or a custom width. This changes only the preview size.",
      },
      export: {
        title: "Export your result",
        body: "Download the edited page as HTML, or the whole site with its assets as a ZIP package.",
      },
      finish: "Start editing",
    },
    help: {
      trigger: "What is this?",
      centerTitle: "Help & settings",
      centerDescription:
        "Learn the workflow or change settings stored by this browser.",
      languageTitle: "Application language",
      tourTitle: "Guided tour",
      tourBody:
        "Replay the four-step introduction to the main parts of the editor.",
      replayTour: "Replay tour",
      privacyTitle: "Privacy",
      privacyBody:
        "Project contents and edits are processed on this device and are not stored on Bennu servers. External resources in a page can contact third-party sites when you explicitly allow them.",
      hotkeysTitle: "Keyboard shortcuts",
      hotkeys: {
        save: "Export / save",
        undo: "Undo",
        redo: "Redo",
        escape: "Close a dialog or finish inline editing",
      },
      localDataTitle: "Local data",
      localDataBody:
        "Language, interface preferences, tour progress, and recovery drafts may be stored in this browser.",
      clearLocalData: "Clear local data",
      clearLocalDataHint:
        "This removes Bennu preferences and recovery drafts from this browser. Download anything you need first.",
      creatorTitle: "Created by Gennady Zakharov",
      creatorBody:
        "Digital marketing specialist and product builder. Since 2016, Gennady has connected strategy, analytics, teams, and digital products.",
      creatorSite: "Main website",
      openProject: {
        title: "Open project",
        body: "Choose an HTML file or ZIP package. Bennu reads it in your browser; it is not uploaded to a Bennu project server.",
      },
      openFolder: {
        title: "Open site folder",
        body: "Use this when a page depends on nearby images, stylesheets, or other files. Select the whole site folder.",
      },
      outline: {
        title: "Document outline",
        body: "A compact list of the page's main structural regions. Choose a region to navigate a long document.",
      },
      preview: {
        title: "Editable preview",
        body: "This is the rendered page. Click an element to select it, then edit it directly or use the inspector.",
      },
      viewport: {
        title: "Preview width",
        body: "These controls simulate common screen widths. They do not rewrite the responsive rules in your site.",
      },
      privatePreview: {
        title: "Private preview",
        body: "Blocks external requests, forms, embedded pages, and redirects while you inspect an unfamiliar project.",
      },
      safeScripts: {
        title: "Safe scripts",
        body: "Keeps scripts and inline event handlers from running in the preview. They are restored in the exported files.",
      },
      inspector: {
        title: "Inspector",
        body: "Edit the selected element's content, dimensions, spacing, appearance, links, media, and HTML attributes.",
      },
      export: {
        title: "Export",
        body: "A single page downloads as HTML. Projects with additional pages or assets download as a ZIP package.",
      },
      recovery: {
        title: "Local recovery",
        body: "Bennu can keep a recovery draft in this browser. It is not a backup; export HTML or ZIP for a durable copy.",
      },
    },
    app: {
      ready: "Ready",
      productSubtitle: "Visual HTML editor",
      openProject: "Open project",
      openFolder: "Open site folder",
      loadDemo: "Load demo",
      outline: "Document outline",
      document: "Document",
      pages: "Pages",
      sitePackage: "Site package",
      resources: "resources",
      packageReady: "full package export",
      aboutEditing: "About editing",
      aboutEditingBody:
        "Bennu edits the browser DOM and exports formatted HTML. Original whitespace and attribute order may change.",
      undo: "Undo",
      redo: "Redo",
      refresh: "Refresh editable preview",
      desktop: "Desktop",
      tablet: "Tablet",
      mobile: "Mobile",
      customWidth: "Custom preview width",
      rotate: "Rotate preview device",
      unsaved: "Unsaved changes",
      safeMode: "Safe mode",
      scriptsActive: "Scripts active",
      inspector: "Inspector",
      export: "Export",
      hidePanel: "Hide panel",
      showPanel: "Show panel",
      loadedFile: "Loaded {name}",
      loadedPackage: "Loaded site package: {count} assets",
      switchedPage: "Switched to page: {name}",
      privatePreview: "Private preview",
      externalResources: "External resources allowed",
      help: "Help",
      savedLocally: "Recovery draft saved locally",
      offline: "Offline · editing stays available",
      online: "Online",
      recoveryTitle: "Recovery draft found",
      recoveryBody:
        "Continue the local project saved {time}. It has not been uploaded to Bennu.",
      restoreDraft: "Restore draft",
      discardDraft: "Discard",
      restoredDraft: "Local draft restored",
      localDataCleared: "Local Bennu data cleared",
      clearConfirm:
        "Remove Bennu preferences and recovery drafts from this browser? Export anything you need first.",
      privateEnabled: "Private preview enabled",
      externalEnabled: "External resources may now contact third-party sites",
      scriptWarning:
        "Run scripts from this project? Scripts can contact external sites and change the preview.",
      edited: "Edited",
      undoStatus: "Undo",
      redoStatus: "Redo",
      previewReady: "Preview ready",
      previewRefreshed: "Preview refreshed",
      selected: "Selected <{tag}>",
      nothingSelected: "Nothing selected",
      exportFailed: "Export failed · check the document and try again",
      exportHtml: "Saved · formatted HTML downloaded",
      exporting: "Exporting site package...",
      exportZip: "Saved · {name} downloaded",
      localAssets:
        "Loaded single HTML. Local assets will be saved in this browser session.",
    },
    preview: {
      editable: "Editable preview",
      frameTitle: "Bennu live HTML preview",
    },
    inspector: {
      emptyTitle: "Select an element",
      emptyBody:
        "Click text, an image, a link, or a layout block in the preview. Its controls will appear here.",
      emptyTip: "Tip: press Escape to leave inline text editing.",
      path: "Selected element path",
      selected: "Selected element",
      measurements: "Element measurements",
      actions: "Element actions",
      remove: "Remove selected element",
      parent: "Parent",
      up: "Up",
      down: "Down",
      duplicate: "Duplicate",
      content: "Content",
      text: "Text",
      media: "Media",
      sourceUrl: "Source URL",
      replaceImage: "Replace image",
      altText: "Alt text",
      altHint: "Describe meaningful images; leave empty only for decoration.",
      objectFit: "Object fit",
      default: "Default",
      cover: "Cover",
      contain: "Contain",
      fill: "Fill",
      link: "Link",
      destination: "Destination",
      openIn: "Open in",
      sameTab: "Same tab",
      newTab: "New tab",
      currentFrame: "Current frame",
      layout: "Layout",
      width: "Width",
      height: "Height",
      maxWidth: "Max width",
      margin: "Margin",
      padding: "Padding",
      top: "Top",
      right: "Right",
      bottom: "Bottom",
      left: "Left",
      textAlignment: "Text alignment",
      center: "Center",
      justify: "Justify",
      appearance: "Appearance",
      color: "Color",
      backgroundColor: "Background color",
      fontSize: "Font size",
      fontWeight: "Font weight",
      lineHeight: "Line height",
      letterSpacing: "Letter spacing",
      visibility: "Visibility",
      visible: "Visible",
      hidden: "Hidden",
      attributes: "HTML attributes",
      id: "ID",
      className: "Class",
      title: "Title",
      technicalSelector: "CSS selector",
      reset: "Reset {label}",
    },
  },
  ru: {
    common: {
      back: "Назад",
      cancel: "Отмена",
      close: "Закрыть",
      continue: "Продолжить",
      done: "Готово",
      next: "Далее",
      previous: "Назад",
      skip: "Пропустить",
      learnMore: "Подробнее",
    },
    welcome: {
      eyebrow: "Визуальный HTML-редактор",
      title: "Редактируйте веб-страницу, никуда её не отправляя",
      description:
        "Откройте HTML-файл, ZIP-архив или папку сайта. Bennu покажет страницу в браузере: выбирайте элементы, вносите изменения и скачивайте результат.",
      languageTitle: "Выберите язык",
      languageHint:
        "На этом языке будут тур и весь интерфейс. Позже язык можно изменить в разделе «Помощь».",
      localTitle: "Проект остаётся на этом устройстве",
      localBody:
        "В Bennu нет облака проектов и аккаунтов. Файлы и изменения обрабатываются в этом браузере. Страница может обращаться к сторонним сайтам, только если вы разрешите внешние ресурсы.",
      editTitle: "Нажимайте и редактируйте",
      editBody:
        "Выберите в предпросмотре текст, изображение, ссылку или блок и настройте его в инспекторе.",
      exportTitle: "Скачивайте обычные файлы",
      exportBody:
        "Заберите готовую работу как HTML или ZIP-архив, который не зависит от Bennu.",
      openProject: "Открыть свой проект",
      tryDemo: "Попробовать демо",
      skip: "Пропустить знакомство",
      dialogLabel: "Добро пожаловать в Bennu",
    },
    tour: {
      dialogLabel: "Знакомство с Bennu",
      progress: "Шаг {current} из {total}",
      open: {
        title: "Начните со своих файлов",
        body: "Откройте один HTML-файл, ZIP-архив или папку сайта. Браузер прочитает их локально.",
      },
      preview: {
        title: "Выберите, что нужно изменить",
        body: "Нажмите на текст, изображение, ссылку или блок в предпросмотре. Настройки элемента появятся в инспекторе.",
      },
      viewport: {
        title: "Проверьте разные размеры экрана",
        body: "Переключайтесь между компьютером, планшетом, телефоном или задайте ширину сами. Меняется только размер предпросмотра.",
      },
      export: {
        title: "Экспортируйте результат",
        body: "Скачайте изменённую страницу как HTML или весь сайт вместе с файлами как ZIP-архив.",
      },
      finish: "Начать работу",
    },
    help: {
      trigger: "Что это?",
      centerTitle: "Помощь и настройки",
      centerDescription:
        "Посмотрите, как устроена работа, или измените настройки, сохранённые в этом браузере.",
      languageTitle: "Язык приложения",
      tourTitle: "Обучающий тур",
      tourBody: "Повторите знакомство с четырьмя основными частями редактора.",
      replayTour: "Повторить тур",
      privacyTitle: "Приватность",
      privacyBody:
        "Содержимое проектов и изменения обрабатываются на этом устройстве и не хранятся на серверах Bennu. Внешние ресурсы страницы могут обращаться к сторонним сайтам, если вы явно их разрешите.",
      hotkeysTitle: "Горячие клавиши",
      hotkeys: {
        save: "Экспорт / сохранение",
        undo: "Отменить",
        redo: "Повторить",
        escape: "Закрыть окно или закончить редактирование текста",
      },
      localDataTitle: "Локальные данные",
      localDataBody:
        "Язык, настройки интерфейса, прохождение тура и черновики восстановления могут храниться в этом браузере.",
      clearLocalData: "Очистить локальные данные",
      clearLocalDataHint:
        "Настройки Bennu и черновики восстановления будут удалены из этого браузера. Сначала скачайте всё нужное.",
      creatorTitle: "Создано Геннадием Захаровым",
      creatorBody:
        "Специалист по цифровому маркетингу и создатель продуктов. С 2016 года Геннадий соединяет стратегию, аналитику, команды и цифровые решения.",
      creatorSite: "Основной сайт",
      openProject: {
        title: "Открыть проект",
        body: "Выберите HTML-файл или ZIP-архив. Bennu прочитает его в браузере и не загрузит на сервер проектов.",
      },
      openFolder: {
        title: "Открыть папку сайта",
        body: "Используйте этот вариант, если странице нужны соседние изображения, стили или другие файлы. Выберите всю папку сайта.",
      },
      outline: {
        title: "Структура документа",
        body: "Краткий список основных областей страницы. Выберите область, чтобы быстрее перемещаться по длинному документу.",
      },
      preview: {
        title: "Редактируемый предпросмотр",
        body: "Здесь показана страница. Нажмите на элемент, затем измените его напрямую или через инспектор.",
      },
      viewport: {
        title: "Ширина предпросмотра",
        body: "Эти кнопки имитируют распространённые размеры экранов. Они не переписывают адаптивные правила сайта.",
      },
      privatePreview: {
        title: "Приватный предпросмотр",
        body: "Блокирует внешние запросы, формы, встроенные страницы и перенаправления во время просмотра незнакомого проекта.",
      },
      safeScripts: {
        title: "Безопасные скрипты",
        body: "Не даёт скриптам и встроенным обработчикам событий запускаться в предпросмотре. При экспорте они восстанавливаются.",
      },
      inspector: {
        title: "Инспектор",
        body: "Настраивайте содержимое, размеры, отступы, оформление, ссылки, медиа и HTML-атрибуты выбранного элемента.",
      },
      export: {
        title: "Экспорт",
        body: "Одна страница скачивается как HTML. Проект с дополнительными страницами или ресурсами — как ZIP-архив.",
      },
      recovery: {
        title: "Локальное восстановление",
        body: "Bennu может хранить черновик в этом браузере. Это не резервная копия: для надёжного хранения экспортируйте HTML или ZIP.",
      },
    },
    app: {
      ready: "Готово",
      productSubtitle: "Визуальный HTML-редактор",
      openProject: "Открыть проект",
      openFolder: "Открыть папку сайта",
      loadDemo: "Загрузить демо",
      outline: "Структура документа",
      document: "Документ",
      pages: "Страницы",
      sitePackage: "Пакет сайта",
      resources: "ресурсов",
      packageReady: "экспорт полного пакета",
      aboutEditing: "О редактировании",
      aboutEditingBody:
        "Bennu редактирует DOM браузера и экспортирует форматированный HTML. Исходные пробелы и порядок атрибутов могут измениться.",
      undo: "Отменить",
      redo: "Повторить",
      refresh: "Обновить предпросмотр",
      desktop: "Компьютер",
      tablet: "Планшет",
      mobile: "Телефон",
      customWidth: "Своя ширина предпросмотра",
      rotate: "Повернуть устройство",
      unsaved: "Есть несохранённые изменения",
      safeMode: "Безопасный режим",
      scriptsActive: "Скрипты включены",
      inspector: "Инспектор",
      export: "Экспорт",
      hidePanel: "Скрыть панель",
      showPanel: "Показать панель",
      loadedFile: "Загружен файл {name}",
      loadedPackage: "Загружен сайт: {count} ресурсов",
      switchedPage: "Открыта страница: {name}",
      privatePreview: "Приватный предпросмотр",
      externalResources: "Внешние ресурсы разрешены",
      help: "Помощь",
      savedLocally: "Черновик сохранён локально",
      offline: "Нет сети · редактирование доступно",
      online: "В сети",
      recoveryTitle: "Найден локальный черновик",
      recoveryBody:
        "Продолжить проект, сохранённый на этом устройстве {time}? Он не загружался в Bennu.",
      restoreDraft: "Восстановить",
      discardDraft: "Удалить",
      restoredDraft: "Локальный черновик восстановлен",
      localDataCleared: "Локальные данные Bennu удалены",
      clearConfirm:
        "Удалить настройки Bennu и черновики восстановления из этого браузера? Сначала экспортируйте всё нужное.",
      privateEnabled: "Приватный предпросмотр включён",
      externalEnabled:
        "Внешние ресурсы теперь могут обращаться к сторонним сайтам",
      scriptWarning:
        "Запустить скрипты этого проекта? Они могут обращаться к внешним сайтам и изменять предпросмотр.",
      edited: "Изменено",
      undoStatus: "Отменено",
      redoStatus: "Повторено",
      previewReady: "Предпросмотр готов",
      previewRefreshed: "Предпросмотр обновлён",
      selected: "Выбран <{tag}>",
      nothingSelected: "Ничего не выбрано",
      exportFailed:
        "Не удалось экспортировать · проверьте документ и повторите",
      exportHtml: "Сохранено · HTML скачан",
      exporting: "Собираем пакет сайта...",
      exportZip: "Сохранено · скачан {name}",
      localAssets:
        "HTML загружен. Локальные ресурсы будут храниться в этой сессии браузера.",
    },
    preview: {
      editable: "Редактируемый предпросмотр",
      frameTitle: "Предпросмотр HTML в Bennu",
    },
    inspector: {
      emptyTitle: "Выберите элемент",
      emptyBody:
        "Нажмите в предпросмотре на текст, изображение, ссылку или блок. Здесь появятся его настройки.",
      emptyTip: "Совет: нажмите Escape, чтобы закончить редактирование текста.",
      path: "Путь к выбранному элементу",
      selected: "Выбранный элемент",
      measurements: "Размеры элемента",
      actions: "Действия с элементом",
      remove: "Удалить выбранный элемент",
      parent: "Родитель",
      up: "Выше",
      down: "Ниже",
      duplicate: "Дублировать",
      content: "Содержимое",
      text: "Текст",
      media: "Медиа",
      sourceUrl: "Адрес файла",
      replaceImage: "Заменить изображение",
      altText: "Альтернативный текст",
      altHint:
        "Опишите значимое изображение; оставьте поле пустым только для декоративного.",
      objectFit: "Заполнение области",
      default: "По умолчанию",
      cover: "Обрезать",
      contain: "Вместить",
      fill: "Растянуть",
      link: "Ссылка",
      destination: "Адрес",
      openIn: "Открывать в",
      sameTab: "Той же вкладке",
      newTab: "Новой вкладке",
      currentFrame: "Текущем фрейме",
      layout: "Макет",
      width: "Ширина",
      height: "Высота",
      maxWidth: "Максимальная ширина",
      margin: "Внешние отступы",
      padding: "Внутренние отступы",
      top: "Сверху",
      right: "Справа",
      bottom: "Снизу",
      left: "Слева",
      textAlignment: "Выравнивание текста",
      center: "По центру",
      justify: "По ширине",
      appearance: "Оформление",
      color: "Цвет",
      backgroundColor: "Цвет фона",
      fontSize: "Размер шрифта",
      fontWeight: "Толщина шрифта",
      lineHeight: "Высота строки",
      letterSpacing: "Межбуквенный интервал",
      visibility: "Видимость",
      visible: "Виден",
      hidden: "Скрыт",
      attributes: "HTML-атрибуты",
      id: "ID",
      className: "Класс",
      title: "Подсказка",
      technicalSelector: "CSS-селектор",
      reset: "Сбросить: {label}",
    },
  },
});

export function normalizeLanguage(language) {
  const candidate = String(language || "")
    .toLowerCase()
    .split("-")[0];
  return Object.hasOwn(languages, candidate) ? candidate : DEFAULT_LANGUAGE;
}

function lookup(language, key) {
  if (
    typeof key !== "string" ||
    !key ||
    key
      .split(".")
      .some(
        (part) =>
          !part ||
          part === "__proto__" ||
          part === "constructor" ||
          part === "prototype",
      )
  )
    return undefined;
  return key
    .split(".")
    .reduce(
      (value, part) =>
        value && Object.hasOwn(value, part) ? value[part] : undefined,
      dictionaries[language],
    );
}

function interpolate(value, variables) {
  return value.replace(/\{([\w-]+)\}/g, (match, name) =>
    Object.hasOwn(variables, name) ? String(variables[name]) : match,
  );
}

export function translate(language, key, variables = {}) {
  const normalized = normalizeLanguage(language);
  const value = lookup(normalized, key) ?? lookup(DEFAULT_LANGUAGE, key);
  return typeof value === "string"
    ? interpolate(
        value,
        variables && typeof variables === "object" ? variables : {},
      )
    : key;
}

// Default-language convenience API. For a dynamic UI, bind it with createTranslator(language).
export function t(key, variables = {}) {
  return translate(DEFAULT_LANGUAGE, key, variables);
}

export function createTranslator(language) {
  const normalized = normalizeLanguage(language);
  return (key, variables = {}) => translate(normalized, key, variables);
}
