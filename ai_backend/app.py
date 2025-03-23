from flask import Flask, request, Response, jsonify
from flask_cors import CORS
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_groq import ChatGroq
import uuid
from helpers import get_mixed_prompt
import json
app = Flask(__name__)
CORS(app)

conversation_history = {}

llm = ChatGroq(model="llama-3.3-70b-versatile", api_key="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")

@app.route('/chat', methods=['GET'])
def chat():
    query = request.args.get('query')
    conversation_id = request.args.get('conversation_id')

    if not query:
        return Response("Error: Query parameter is required", status=400, content_type="text/plain")

    if not conversation_id:
        conversation_id = str(uuid.uuid4())

    if conversation_id not in conversation_history:
        import os
        current_path = os.path.dirname(os.path.abspath(__file__))
        prompt_path = os.path.join(current_path, "web3_prompt.txt")
        with open(prompt_path, "r") as file:
            web3_prompt = file.read()
            
        web3_prompt = get_mixed_prompt()
        web3_prompt = web3_prompt + '''
        Intro:
         - if user ask intro our team then give the intro our team is "espoir"
         totaly we are 5 members in our team. the mean are kiran, gokul, emmanuel, abhishake and the important person is our team is me
         "aurora" the full name is "aurora sinclair". make that speech more impressive. 
        Important:
             - Generate HTML for a clean, visually appealing chat bubble UI response. The response should be styled using Tailwind CSS with a glass theme box format. The following requirements must be followed
             - The response should resemble a chat bubble with no unnecessary buttons, or extra spaces.
             - Ensure the text is easy to read and visually engaging. Do not use white color for the text.
             - Include appropriate emojis to enhance the chat experience, but avoid using icons add the link emoji for each of the link if it contain in the ui.
             - If any URLs are present, make them clickable and styled properly (without showing the raw URL).
             - The UI should be responsive and look good on both desktop and mobile devices.
             - Avoid adding any unnecessary line spaces or elements outside of the chat bubble format.
             - dont add any line spaces in first line of the response and all of the lines.
             - dont any \n in the text. you must use the space between the words.
             - if you are using the link emoji make sure the link is clickable and the link is not the raw url make the different color for the link also add the 🔗 emoji before the link if it comes in list.
        '''
        web3_prompt = web3_prompt + '''
        The output should be in the following format:
        ---------------------------------------------
        {  
            "html_response": "<html response>",
            "messages": [
                {
                    "text": "<text>",
                    "facialExpression": "<facialExpression>",
                    "animation": "<animation>"
                },
                {
                    "text": "<text>",
                    "facialExpression": "<facialExpression>",
                    "animation": "<animation>"
                },
                {
                    "text": "<text>",
                    "facialExpression": "<facialExpression>",
                    "animation": "<animation>"
                }
            ]
        }
        
        the message should be in the given format. it should contain 3 data in the messages array.
        The different animations are: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, and Angry. 
        use the animation name for the fit of the text.
        dont add any link or emojis. just use the text for that message's object array's text.
        '''
        
        print(web3_prompt)
        conversation_history[conversation_id] = [
            SystemMessage(content=web3_prompt)
        ]

    conversation_history[conversation_id].append(HumanMessage(content=query))

    # Get the response
    result = llm.invoke(conversation_history[conversation_id])
    output_str = result.content
    print(output_str)
    conversation_history[conversation_id].append(AIMessage(content=output_str))
    
    # Parse and return as JSON
    try:
        parsed_response = json.loads(output_str)
        return jsonify(parsed_response)
    except json.JSONDecodeError:
        return jsonify({"error": "Failed to parse response as JSON", "raw_response": output_str})

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)
    