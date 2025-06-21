import LLM "mo:llm";

actor {
  // Prompt-based summarization function
  public func summarize(text : Text) : async Text {
    let promptText = "Please summarize the following document:\n\n" # text;
    let response = await LLM.prompt(#Llama3_1_8B, promptText);
    return response;
  };

  // Regular chat function for general messages
  public func chat(messages : [LLM.ChatMessage]) : async Text {
    let response = await LLM.chat(#Llama3_1_8B).withMessages(messages).send();

    switch (response.message.content) {
      case (?text) text;
      case null "";
    };
  };
};
