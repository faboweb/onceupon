const OpenAI = require("openai");
const { db } = require("./firebase");
const networks = require("./networks");

const getClient = () => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  return openai;
};

const summarize = async (text) => {
  const openai = getClient();
  const summaryPrompt = `Summarize the following section in concise bullet points, focusing only on the most essential details.\n\n${text}`;
  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: summaryPrompt }],
    model: "gpt-3.5-turbo",
  });

  return completion.choices[0].message.content;
};

const createPaths = async (network, storyId) => {
  const sections = await db
    .collection("networks/" + network.id + "/sections")
    .where("story_id", "==", storyId)
    .get();
  const sectionsData = sections.docs.map((doc) => doc.data());
  const sortedSections = sectionsData.sort((a, b) => a.added - b.added);

  const openai = getClient();
  const prompt = `
    Provide the next brief paragraph for the story. Create two very different ones. Only give the brief summary.

    Summaries of the story so far:
    ${sortedSections.map((s) => s.summary).join("\n")}

    Return as a JSON in format: [{
      content: "The short description",
    }]`;
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      // temperature: 1.5,
    });

    const choices = JSON.parse(completion.choices[0].message.content).map(
      (choice) => choice.content
    );
    return choices;
  } catch (e) {
    return createPaths(network, storyId);
  }
};

const createSection = async (network, storyId, amount, description = null) => {
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

  const summary = await summarizeStory(network, storyId, true);

  const openai = getClient();
  const prompt = `
    Create a section of a longer story. Use the following rules:
    - Don't end the story
    - Use 350 to 400 words
    - Don't reveal facts about the setting of the story, instead show those facts through other details.
    - Prefer dialog to show details about a character then describing the details.
    - Write about one scene only.
    - Avoid creating a concluding atmosphere; keep the scene ongoing.
    - Focus on interactions and dialogues without wrapping up any sentiments.
    
    Summary of the story so far:
    ${summary}

    ${
      description
        ? `
    A description of the section (You don't have to use the full description):
    ${description}`
        : ""
    }

    Ending of last section:
    ${lastSectionContent.split(" ").slice(100).join(" ")}
    
    New section:
    `;
  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-3.5-turbo",
    // temperature: 1.5,
    n: amount,
  });

  return completion.choices.map((c) => c.message.content);
};

const createSections = async (network, storyId) => {
  const paths = await createPaths(network, storyId);
  const sections = await Promise.all(
    paths.map((path) => createSection(network, storyId, 1, path))
  );
  return [].concat(...sections);
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

const summarizeStory = async (network, storyId, long = false) => {
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
    Create a summary in max ${
      long ? "100 words" : "240 characters"
    } based on following section summaries:
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
  createSections,
};

// test
// const main = async () => {
//   const network = networks.mainnet;
//   const storyId = "2b2b0155-0d9d-4073-a0b9-4256b860bba0";
//   const sections = await createSections(network, storyId);
//   console.log(sections);
// };

// main();
