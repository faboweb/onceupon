const OpenAI = require("openai");
const { db } = require("./firebase");

const getClient = () => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  return openai;
};

const summarize = async (text) => {
  const openai = getClient();
  const summaryPrompt = `summarize the following section of a story briefly:\n${text}`;
  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: summaryPrompt }],
    model: "gpt-3.5-turbo",
  });

  return completion.choices[0].message.content;
};

const createSection = async (network, storyId) => {
  const sections = await db
    .collection("networks/" + network.id + "/sections")
    .where("story_id", "==", storyId)
    .get();
  const sectionsData = sections.docs.map((doc) => doc.data());
  const sortedSections = sectionsData.sort((a, b) => a.added - b.added);
  const lastSection = sortedSections[sortedSections.length - 1];
  const { content: lastSectionContent } = (
    await db.doc("content/" + lastSection.content_cid).get()
  ).data();

  const openai = getClient();
  const summaryPrompt = `
    Create a section of a longer story in max 250 words. Don't end the story.
    Summaries of the sections so far:
    ${sortedSections.map((s) => s.summary).join("\n")}

    Last section:
    ${lastSectionContent}
    `;
  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: summaryPrompt }],
    model: "gpt-3.5-turbo",
  });

  return completion.choices[0].message.content;
};

module.exports = {
  summarize,
  createSection,
};
