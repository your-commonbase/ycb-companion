import { AppConfig } from '@/utils/AppConfig';

const BaseTemplate = (props: {
  leftNav: React.ReactNode;
  rightNav?: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <div className="w-full antialiased">
      <div className="mx-auto max-w-screen-md">
        <header className="mb-10">
          <div className="flex justify-between items-center">
            <div className="pb-8 pt-8">
              <img
                src="/logomark-ycb.svg"
                className="mr-2 pt-4 inline-block h-12"
                alt="favicon"
              />
              <img
                src="/wordmark-ycb.svg"
                className="inline-block h-16"
                alt="favicon"
              />
            </div>
            <nav>
              <ul className="flex flex-wrap gap-x-5 text-xl">
                {props.rightNav}
              </ul>
            </nav>
          </div>
          <nav>
            <ul className="flex flex-wrap gap-x-5 text-xl">
              {props.leftNav}
            </ul>
          </nav>
        </header>

        <main>{props.children}</main>

        <footer className="py-8 text-center text-sm">
          <a
            className="text-blue-700 hover:border-b-2 hover:border-blue-700"
            href="https://www.icloud.com/shortcuts/e5b66464cff943f286244b06ab79625b"
          >
            Get the iOS shortcut.
          </a>
          <a
            className="text-blue-700 hover:border-b-2 hover:border-blue-700"
            href="https://github.com/bramses/simple-chrome-ycb"
          >
            {' '}
            Get the Chrome Extension.
          </a>
          <a
            className="text-blue-700 hover:border-b-2 hover:border-blue-700"
            href="https://forms.gle/e4MPYNiRDCBixi9j8"
          >
            {' '}
            Feedback.
          </a>
          © Copyright {new Date().getFullYear()} {AppConfig.name}. Boilerplate
          created by{' '}
          <a
            href="https://creativedesignsguru.com"
            className="text-blue-700 hover:border-b-2 hover:border-blue-700"
          >
            CreativeDesignsGuru
          </a>
          .
          {/*
           * PLEASE READ THIS SECTION
           * I'm an indie maker with limited resources and funds, I'll really appreciate if you could have a link to my website.
           * The link doesn't need to appear on every pages, one link on one page is enough.
           * For example, in the `About` page. Thank you for your support, it'll mean a lot to me.
           */}
        </footer>
      </div>
    </div>
  );
};

export { BaseTemplate };
