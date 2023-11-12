import fs, { readdirSync } from "fs";

import { CodeHikeConfig, remarkCodeHike } from "@code-hike/mdx";
import codeHikeTheme from "config/code-hike.theme.json" assert { type: "json" };
import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import { ICommonMarkdown } from "~/components/reference/Reference.types";

const getDirectories = (source) =>
  readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

async function generateRefMarkdown(sections: ICommonMarkdown[], slug: string) {
  let markdownContent = [];
  /**
   * Read all the markdown files that might have
   *  - custom text
   *  - call outs
   *  - important notes regarding implementation
   */
  await Promise.all(
    sections.map(async (section) => {
      let pathName = `docs/ref${slug}/${section.id}.mdx`;

      if (process.env.NODE_ENV === "production") {
        const baseDir = __dirname.split("/.next")[0];
        pathName = `${baseDir}/.next/server/docs/ref${slug}/${section.id}.mdx`;

        console.log('top level dirs')
        console.log(getDirectories(`${baseDir}/.next/server`).join(", "));
      }

      function checkFileExists(x) {
        if (fs.existsSync(x)) {
          return true;
        } else {
          return false;
        }
      }

      const markdownExists = checkFileExists(pathName);

      if (!markdownExists) {
        console.warn({ dirname: __dirname });
        console.warn(`${pathName} does not exist`);
        return null;
      }

      const fileContents = markdownExists
        ? fs.readFileSync(pathName, "utf8")
        : "";
      const { data, content } = matter(fileContents);

      const codeHikeOptions: CodeHikeConfig = {
        theme: codeHikeTheme,
        lineNumbers: true,
        showCopyButton: true,
        skipLanguages: [],
        autoImport: false,
      };

      markdownContent.push({
        id: section.id,
        title: section.title,
        meta: data,
        // introPage: introPages.includes(x),
        content: content
          ? await serialize(content ?? "", {
              // MDX's available options, see the MDX docs for more info.
              // https://mdxjs.com/packages/mdx/#compilefile-options
              mdxOptions: {
                useDynamicImport: true,
                remarkPlugins: [[remarkCodeHike, codeHikeOptions]],
              },
              // Indicates whether or not to parse the frontmatter from the mdx source
            })
          : null,
      });
    })
  );

  return markdownContent;
}

export default generateRefMarkdown;
