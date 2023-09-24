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

const createSection = async (network, storyId, description = null) => {
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
  const prompt = `
    Create a section of a longer story in max 400 words. Don't end the story. Use the following rules:
    - Don't reveal facts about the setting of the story, instead show those facts through other details.
    - Prefer dialog to show details about a character then describing the details.
    
    Summaries of the sections so far:
    ${sortedSections.map((s) => s.summary).join("\n")}

    Last section:
    ${lastSectionContent}
    ${
      description
        ? `
    A description of the section:
    ${description}`
        : ""
    }
    `;
  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-3.5-turbo",
    // temperature: 1.5,
  });

  return completion.choices[0].message.content;
};

const createStory = async (description) => {
  const openai = getClient();
  const prompt = `
    Create the beginning of a book long story with max 400 words. Don't end the story. Use the following rules:
    - Don't reveal facts about the setting of the story, instead show those facts through other details.
    - Prefer dialog to show details about a character then describing the details.

    A description of the story:
    ${description}
    `;
  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-3.5-turbo",
    // temperature: 1.5,
  });

  return completion.choices[0].message.content;
};

const summarizeStory = async (network, storyId) => {
  const sections = await db
    .collection("networks/" + network.id + "/sections")
    .where("story_id", "==", storyId)
    .get();
  if (sections.empty) return null;
  const sectionsData = sections.docs.map((doc) => doc.data());
  const sortedSections = sectionsData.sort((a, b) => a.added - b.added);
  const summaries = sortedSections.map((s) => s.summary);

  const openai = getClient();
  const prompt = `
    Create a summary in max 240 characters based on following section summaries:
    ${summaries.join("\n")}
    `;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-3.5-turbo",
    // temperature: 1.5,
  });

  return completion.choices[0].message.content;
};

// const summarizeAccount = async (network, user) => {
//   const userStories = await db
//     .collection("networks/" + network.id + "/sections")
//     .where("proposer", "==", user)
//     .get();
//   if ()
//   const sectionsData = userStories.docs.map((doc) => doc.data());
//   const sortedSections = sectionsData.sort((a, b) => a.added - b.added);
//   const summaries = sortedSections.map((s) => s.summary);

//   const openai = getClient();
//   const prompt = `
//     Create a summary in max 240 characters based on following section summaries:
//     ${summaries.join("\n")}
//     `;

//   const completion = await openai.chat.completions.create({
//     messages: [{ role: "user", content: prompt }],
//     model: "gpt-3.5-turbo",
//     // temperature: 1.5,
//   });

//   return completion.choices[0].message.content;
// };

module.exports = {
  summarize,
  createSection,
  summarizeStory,
  createStory,
};
