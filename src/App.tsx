
import React from 'react';
import ReactDOM from 'react-dom';
import { ipcRenderer } from 'electron';

type Props = {};
type State = {
  documents: Array<string>,
  text: string,
  previousName: string|null,

  controlsHidden: boolean,
  theme: 'theme-dark'|'theme-light',
  font: 'sans-serif'|'serif'|'monospace',
};

class App extends React.Component<Props,State> {

  state: State = {
    documents: [],
    text: '',
    previousName: null,

    controlsHidden: false,
    theme: 'theme-dark',
    font: 'sans-serif'
  };

  textAreaRef: HTMLTextAreaElement|null|undefined;


  componentDidMount() {
    window.addEventListener('keydown', () => this.setState({ controlsHidden: true }));
    window.addEventListener('mousemove', (e) => this.setState({ controlsHidden: false }));

    this.loadDocumentsList();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {

    // textarea auto-expands vertically to fit content
    if(this.textAreaRef != null) {
      //this.textAreaRef.style.height = `${this.textAreaRef.scrollHeight}px`;
    }
  }

  render() {
    return (
      <div className={`app ${this.state.theme}`}>
        <div className={`controls ${this.state.controlsHidden ? 'hidden' : ''}`}>
          <div className="buttons fonts">
            {this._renderCheckbox('font', 'sans-serif')}
            &nbsp;
            &nbsp;
            {this._renderCheckbox('font', 'serif')}
            &nbsp;
            &nbsp;
            {this._renderCheckbox('font', 'monospace')}
          </div>
          <div className="buttons themes">
            {this._renderCheckbox('theme', 'theme-light')}
            &nbsp;
            &nbsp;
            {this._renderCheckbox('theme', 'theme-dark')}
          </div>

          <div className="documents">

            <div 
                className={`document-listing ${!this.state.text.trim() ? 'selected' : ''}`} 
                onClick={this.newDocument}>
              + New
            </div>

            {this.state.documents.map(doc =>
              <div 
                  className={`document-listing ${documentName(this.state.text) === doc ? 'selected' : ''}`} 
                  onClick={() => this.loadDocumentText(doc)} key={doc}>
                {doc}
              </div>)}

          </div>
        </div>
      
        <textarea 
          className={`document ${this.state.font}`} 
          value={this.state.text} 
          onChange={this.handleTextareaChange}
          onKeyDown={this.handleTextareaKeyDown}
          ref={el => this.textAreaRef = el} />
      </div>
    )
  }

  _renderCheckbox = (keyName: 'font'|'theme', value: string) =>
    <input 
      type="radio" 
      name={keyName}
      value={value}
      className={value}
      checked={this.state[keyName] === value}
      onChange={e => this.setState({ [keyName]: e.target.value })} />


  handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => 
    this.setState({ text: e.target.value }, this.saveCurrentDocument);

  handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if(e.key === 'Tab') {
      e.preventDefault();

      let textarea = e.target as HTMLTextAreaElement;
      let cursorPosition = textarea.selectionStart;

      this.setState({ 
        text: textarea.value.substr(0, cursorPosition) + '\t' + textarea.value.substr(cursorPosition)
      }, () => {
        textarea.selectionStart = textarea.selectionEnd = cursorPosition + 1;
        this.saveCurrentDocument();
      });
    }
  }

  newDocument = () => {
    this.setState({
      text: '',
      previousName: null
    })
  }

  loadDocumentsList = () =>
    ipcPromise('list-documents')
      .then(res => this.setState({ documents: JSON.parse(res) }));

  loadDocumentText = (document: string) =>
    ipcPromise('load-document', document)
      .then(res => 
        this.setState({ 
          text: res,
          previousName: document
        }));

  saveCurrentDocument = () => {
    if(this.state.text.trim() && !this.saving) {
      this.saving = true;
      let { previousName, text } = this.state;

      ipcPromise('save-document', previousName, documentName(text), text)
        .then(() => 
          this.setState({ 
            previousName: documentName(text)
          }))
        .then(this.loadDocumentsList)
        .finally(() => this.saving = false)
    }
  }

  saving = false;
}

const documentName = (documentBody: string) =>
  (documentBody
    .split('\n')
    .find(line => !!line) || '')
    .replace(/[\/|\\:*?"<>]/g, " ") + '.txt';

const ipcPromise = (event: string, ...args: Array<string|null|undefined>): Promise<string> =>
    new Promise(res => {
      ipcRenderer.once(event, (event, arg) => res(arg))
      ipcRenderer.send(event, ...args);
    })

window.onload = () => ReactDOM.render(<App />, document.querySelector('#root'));