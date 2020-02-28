
import React from 'react';
import ReactDOM from 'react-dom';
import { ipcRenderer } from 'electron';

type Props = {};
type State = {
  documents: Array<string>,
  currentDocument: string,
  currentDocumentBody: string,

  controlsHidden: boolean,
  theme: 'theme-dark'|'theme-light',
  font: 'sans-serif'|'serif'|'monospace',
};

class App extends React.Component<Props,State> {

  state: State = {
    documents: [],
    currentDocument: '',
    currentDocumentBody: '',

    controlsHidden: false,
    theme: 'theme-dark',
    font: 'sans-serif'
  };

  textAreaRef: HTMLTextAreaElement|null|undefined;

  componentDidMount() {
    window.addEventListener('keydown', () => this.setState({ controlsHidden: true }));
    window.addEventListener('mousemove', (e) => {
      if(e.target !== this.textAreaRef) {
        this.setState({ controlsHidden: false })
      }
    });

    this.updateDocuments();
  }

  componentDidUpdate() {
    // textarea auto-expands vertically to fit content
    if(this.textAreaRef != null) {
      this.textAreaRef.style.height = `${this.textAreaRef.scrollHeight}px`;
    }
  }

  render() {
    return (
      <div className={`app ${this.state.theme}`}>
        <div className={`controls left ${this.state.controlsHidden ? 'hidden' : ''}`}>
          <div className="buttons fonts">
            {this._renderFontCheckbox('sans-serif')}
            {this._renderFontCheckbox('serif')}
            {this._renderFontCheckbox('monospace')}
          </div>
          <div className="buttons themes">
            {this._renderThemeCheckbox('theme-light')}
            {this._renderThemeCheckbox('theme-dark')}
          </div>

          <div className="documents">
            {this.state.documents.map(doc =>
              <div 
                  className={`document-listing ${doc === this.state.currentDocument ? 'selected' : ''}`} 
                  onClick={() => this.loadDocument(doc)} key={doc}>
                {doc}
              </div>)}
          </div>
        </div>
      
        <textarea 
          className={`document ${this.state.font}`} 
          value={this.state.currentDocumentBody} 
          onChange={this.handleBodyChange} />
      </div>
    )
  }

  _renderFontCheckbox = (font: string) =>
    <input 
      type="radio" 
      name="font" 
      value={font}
      className={font}
      checked={this.state.font === font}
      onChange={e => this.setState({ font: e.target.value })} />

  _renderThemeCheckbox = (theme: string) =>
    <input 
      type="radio" 
      name="theme" 
      value={theme} 
      className={theme}
      checked={this.state.theme === theme}
      onChange={e => this.setState({ theme: e.target.value })} />


  handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => 
    this.setState({ currentDocumentBody: e.target.value }, this.saveCurrentDocument);

  updateDocuments = () => {
    ipcRenderer.once('list-documents', (event, arg) => {
      this.setState({ documents: JSON.parse(arg) })
    })
    ipcRenderer.send('list-documents');
  }

  loadDocument = (document: string) => {
    ipcRenderer.once('load-document', (event, arg) => {
      this.setState({ 
        currentDocument: document,
        currentDocumentBody: arg
      })
    })
    ipcRenderer.send('load-document', document);
  }

  saveCurrentDocument = () => {
    ipcRenderer.send('save-document', this.state.currentDocument, this.state.currentDocumentBody);
  }
}

window.onload = () => ReactDOM.render(<App />, document.querySelector('#root'));