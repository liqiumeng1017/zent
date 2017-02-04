import React from 'react';
import noop from 'lodash/noop';
import { shallow, mount } from 'enzyme';

import ZentForm from '../src';

describe('CreateForm and Field', () => {
  const { Form, createForm, Field } = ZentForm;
  const returnedFunction = createForm();
  const DivCreated = returnedFunction('div');
  const FormCreated = returnedFunction(Form);
  const context = mount(
    <FormCreated>
      <Field name="bar" component={props => (<div {...props} />)} />
    </FormCreated>
  ).find(Field).getNode().context;

  it('createForm return a function that have arg[0] using with react.createElement.\nThat returnedFunction return a react class with default state, props, functions', () => {
    expect(typeof returnedFunction).toBe('function');
    let wrapper = mount(<DivCreated />);
    expect(wrapper.find('div').length).toBe(1);
    wrapper = mount(<FormCreated />);
    expect(wrapper.find('form').length).toBe(1);
    expect(wrapper.props().onValid).toBe(noop);
    expect(wrapper.props().onInvalid).toBe(noop);
    expect(wrapper.props().onChange).toBe(noop);
    expect(wrapper.props().onSubmit).toBe(noop);
    expect(wrapper.props().onSubmitFail).toBe(noop);
    expect(wrapper.props().onSubmitSuccess).toBe(noop);
    expect(wrapper.props().validationErrors).toBe(null);
    expect(wrapper.state('isFormValid')).toBe(true);
    expect(wrapper.state('isSubmitting')).toBe(false);
    expect(wrapper.getNode().fields.length).toBe(0);
    expect(wrapper.getNode()._isMounted).toBe(true);
  });

  it('Field must in a created zent-form, and must have name and component props', () => {
    expect(() => { shallow(<Field />) }).toThrow();
    expect(() => { mount(<Field />) }).toThrow();
    expect(() => { mount(<FormCreated><Field component={props => (<div {...props} className="bar" />)} /></FormCreated>) }).toThrow();
    expect(() => { mount(<FormCreated><Field name="foo" /></FormCreated>) }).toThrow();
    expect(() => { mount(<FormCreated><Field name="foo" component={props => (<div {...props} className="bar" />)} /></FormCreated>) }).not.toThrow();
  });

  it('Field will load context from created zent-form and default state while render', () => {
    const nestedWrapper = mount(
      <FormCreated>
        <Field name="bar" component={props => (<div {...props} />)} />
      </FormCreated>
    );
    expect(nestedWrapper.find(Field).length).toBe(1);
    expect(typeof nestedWrapper.find(Field).getNode().context.zentForm).toBe('object');
    const wrapper = mount(<Field name="foo" component={props => (<div {...props} />)} />, { context });
    expect(typeof wrapper.context('zentForm')).toBe('object');
    expect(wrapper.state('_value')).toBe(undefined);
    expect(wrapper.state('_isValid')).toBe(true);
    expect(wrapper.state('_isPristine')).toBe(true);
    expect(wrapper.state('_isValidating')).toBe(false);
    expect(wrapper.state('_pristineValue')).toBe(undefined);
    expect(wrapper.state('_validationError').length).toBe(0);
    expect(wrapper.state('_externalError')).toBe(null);
  });

  it('Field have componentWillRecieveProps method', () => {
    const wrapper = mount(<Field name="foo" component={props => (<div {...props} />)} />, { context });
    expect(Object.keys(wrapper.getNode()._validations).length).toBe(0);
    const validationsObj = { foo: noop };
    wrapper.setProps({ validations: validationsObj });
    expect(wrapper.getNode()._validations).toBe(validationsObj);
  });

  it('Field have componentWillUpdate method', () => {
    const contextCopy = Object.assign({}, context, {});
    const validateMock = jest.fn();
    contextCopy.zentForm.validate = validateMock;
    const wrapper = mount(<Field name="foo" component={props => (<div {...props} />)} />, { context: contextCopy });
    expect(wrapper.state('_value')).toBe(undefined);
    wrapper.setProps({ value: 'foo' });
    expect(validateMock.mock.calls.length).toBe(1);
    expect(validateMock.mock.calls[0][0]).toBe(wrapper.getNode());
    wrapper.setProps({ value: undefined });
  });

  it('Field have componentWillUnmount method', () => {
    const contextCopy = Object.assign({}, context, {});
    const detachFromFormMock = jest.fn();
    contextCopy.zentForm.detachFromForm = detachFromFormMock;
    const wrapper = mount(<Field name="foo" component={props => (<div {...props} />)} />, { context: contextCopy });
    expect(detachFromFormMock.mock.calls.length).toBe(0);
    wrapper.unmount();
    expect(detachFromFormMock.mock.calls.length).toBe(1);
    expect(detachFromFormMock.mock.calls[0][0]).toBe(wrapper.getNode());
  });

  it('In Field render function, an element based on component prop will be created and will load some processed props on component (add "checked" on checkbox and delete "value" on both checkbox and file)', () => {
    let wrapper = mount(<Field name="foo" component={() => (<div className="foo" />)} />, { context });
    expect(wrapper.find('.foo').type()).toBe('div');
    expect(wrapper.find('.foo').length).toBe(1);
    expect(wrapper.find('component').prop('name')).toBe('foo');
    expect(wrapper.find('component').prop('validationError')).toBe('');
    expect(Object.keys(wrapper.find('component').prop('validationErrors')).length).toBe(0);
    expect(wrapper.find('component').prop('isTouched')).toBe(false);
    expect(wrapper.find('component').prop('isPristine')).toBe(true);
    expect(wrapper.find('component').prop('isValid')).toBe(true);
    expect(wrapper.find('component').prop('value')).toBe(undefined);
    expect('value' in wrapper.find('component').props()).toBe(true);
    expect(wrapper.find('component').prop('error')).toBe(null);
    expect(wrapper.find('component').prop('errors').length).toBe(0);
    expect(wrapper.find('component').prop('onChange')).toBe(wrapper.getNode().onChange);
    wrapper = mount(<Field name="foo" component={() => (<div className="foo" />)} type="checkbox" />, { context });
    expect(wrapper.find('component').prop('checked')).toBe(false);
    expect('value' in wrapper.find('component').props()).toBe(false);
    wrapper = mount(<Field name="foo" component={() => (<div className="foo" />)} type="file" />, { context });
    expect('value' in wrapper.find('component').props()).toBe(false);
  });

  it('Field can have normalize prop(function), and it will be excuted with change event', () => {
    const fakeReturnedPre = { bar: 'foo' };
    const normalizeMock = jest.fn().mockImplementation(val => `fb${val}`);
    const getFormValuesMock = jest.fn().mockImplementation(() => fakeReturnedPre);
    const contextCopy = Object.assign({}, context, {});
    contextCopy.zentForm.getFormValues = getFormValuesMock;
    const wrapper = mount(<Field name="foofoo" component={props => (<div {...props} />)} normalize={normalizeMock} value="init" />, { context: contextCopy });
    expect(wrapper.find('component').prop('value')).toBe('fbinit');
    expect(wrapper.state('_value')).toBe('init');
    expect(normalizeMock.mock.calls.length).toBe(1);
    expect(getFormValuesMock.mock.calls.length).toBe(1);
    expect(normalizeMock.mock.calls[0][0]).toBe('init');
    expect(normalizeMock.mock.calls[0][1]).toBe('init');
    expect(normalizeMock.mock.calls[0][2].bar).toBe('foo');
    expect(normalizeMock.mock.calls[0][2].foofoo).toBe('init');
    expect(normalizeMock.mock.calls[0][3].bar).toBe('foo');
    wrapper.simulate('change', { target: { value: 'eve' } });

    // NOTE: 因为onChange会触发一次状态更新rerender，所以会执行两次this.normalize。初始值会变为从事件对象中提取的value值。
    expect(wrapper.find('component').prop('value')).toBe('fbfbeve');
    expect(normalizeMock.mock.calls.length).toBe(3);
    expect(getFormValuesMock.mock.calls.length).toBe(3);
    expect(normalizeMock.mock.calls[1][0]).toBe('eve');
    expect(normalizeMock.mock.calls[2][0]).toBe('fbeve');
    expect(normalizeMock.mock.calls[1][1]).toBe('init');
    expect(normalizeMock.mock.calls[2][1]).toBe('fbeve');
    expect(normalizeMock.mock.calls[1][2].bar).toBe('foo');
    expect(normalizeMock.mock.calls[2][2].bar).toBe('foo');
    expect(normalizeMock.mock.calls[1][2].foofoo).toBe('eve');
    expect(normalizeMock.mock.calls[2][2].foofoo).toBe('fbeve');
    expect(normalizeMock.mock.calls[1][3].bar).toBe('foo');
    expect(normalizeMock.mock.calls[2][3].bar).toBe('foo');
  });

  it('Field have an unused getWrappedField function', () => {
    let wrapper = mount(<Field name="foo" component={() => (<div className="foo" />)} />, { context });
    expect(typeof wrapper.getNode().getWrappedField).toBe('function');

    // NOTE: 'this.wrappedField = ref then wrappedField turns out null'
    expect(wrapper.getNode().getWrappedField()).toBe(null);
  });

  // branch hack
  it('Field will return an empty array if isValid return false and _validationError is false value', () => {
    let wrapper = mount(<Field name="foo" component={() => (<div className="foo" />)} />, { context });
    expect(wrapper.state('_validationError').length).toBe(0);
    wrapper.setState({ _validationError: null, _isValid: false });
    expect(wrapper.state('_isValid')).toBe(false);
    expect(wrapper.state('_externalError')).toBe(null);
    expect(wrapper.state('_validationError')).toBe(null);
  });

  it('CreatedForm have componentDidUpdate method, and will be triggered when validationErrors occurred', () => {
    class FormForTest extends React.Component {
      render() {
        return (
          <Form>
            <Field name="foo" component={() => (<div className="foo-div" />)} />
            <Field name="bar" component={() => (<div className="bar-div" />)} />
          </Form>
        );
      }
    }
    const CreatedForm = createForm()(FormForTest);
    const wrapper = mount(<CreatedForm />);
    expect(wrapper.getNode().fields[0].props.name).toBe('foo');
    expect(wrapper.getNode().fields[0].state._isValid).toBe(true);
    expect(wrapper.getNode().fields[1].props.name).toBe('bar');
    expect(wrapper.getNode().fields[1].state._isValid).toBe(true);
    wrapper.setProps({ validationErrors: { foo: 'bar', bar: 'foo' } });
    expect(wrapper.getNode().prevFieldNames[0]).toBe('foo');
    expect(wrapper.getNode().prevFieldNames[1]).toBe('bar');
    expect(wrapper.getNode().fields[0].state._isValid).toBe(false);
    expect(wrapper.getNode().fields[0].state._validationError[0]).toBe('bar');
    expect(wrapper.getNode().fields[1].state._isValid).toBe(false);
    expect(wrapper.getNode().fields[1].state._validationError[0]).toBe('foo');
    wrapper.setProps({ validationErrors: { foo: 123, bar: 321 } });
    expect(wrapper.getNode().fields[0].state._validationError).toBe(123);
    expect(wrapper.getNode().fields[1].state._validationError).toBe(321);
  });

  it('CreatedForm will revalidate when names of fields change, and it can reset, while reset will revalidate, too', () => {
    class FormForTest extends React.Component {
      static propTypes = {
        fieldName: React.PropTypes.string.isRequired
      }

      static defaultProps = {
        fieldName: 'foo'
      }

      render() {
        const { fieldName } = this.props;
        return (
          <Form>
            <Field name={fieldName} component={() => (<div className="foo-div" />)} validations={{ required: true }} value={fieldName === 'foo' ? 1 : undefined} />
          </Form>
        );
      }
    }

    const CreatedForm = createForm()(FormForTest);
    const wrapper = mount(<CreatedForm fieldName="bar" />);
    expect(wrapper.find(Field).props().name).toBe('bar');
    expect(wrapper.state('isFormValid')).toBe(false);
    wrapper.setProps({ fieldName: 'foo' });
    expect(wrapper.find(Field).props().name).toBe('foo');
    expect(wrapper.state('isFormValid')).toBe(true);
    expect(wrapper.find(Field).getNode().state._value).toBe(1);
    wrapper.getNode().reset();
    expect(wrapper.find(Field).getNode().state._value).toBe(undefined);
    expect(wrapper.state('isFormValid')).toBe(false);
    wrapper.getNode().reset({
      foo: 1
    });
    expect(wrapper.find(Field).getNode().state._value).toBe(1);
    expect(wrapper.state('isFormValid')).toBe(true);
  });

  it('CreatedForm have isValid and getFieldError functions', () => {
    class FormForTest extends React.Component {
      static propTypes = {
        fieldName: React.PropTypes.string.isRequired
      }

      static defaultProps = {
        fieldName: 'foo'
      }

      render() {
        const { fieldName } = this.props;
        return (
          <Form>
            <Field name={fieldName} component={() => (<div className="foo-div" />)} validations={{ required: true }} validationErrors={{ required: '不能为空' }} value={fieldName === 'foo' ? 1 : undefined} />
          </Form>
        );
      }
    }

    const CreatedForm = createForm()(FormForTest);
    const wrapper = mount(<CreatedForm fieldName="bar" />);
    expect(wrapper.state('isFormValid')).toBe(false);
    expect(wrapper.getNode().isValid()).toBe(false);
    expect(wrapper.getNode().getFieldError('foo')).toBe('');
    expect(wrapper.getNode().getFieldError('bar')).toBe('不能为空');
  });

  it('CreatedForm have an unused function "isValidValue"', () => {
    class FormForTest extends React.Component {
      static propTypes = {
        fieldName: React.PropTypes.string.isRequired
      }

      static defaultProps = {
        fieldName: 'foo'
      }

      render() {
        const { fieldName } = this.props;
        return (
          <Form>
            <Field name={fieldName} component={() => (<div className="foo-div" />)} validations={{ required: true }} validationErrors={{ required: '不能为空' }} value={fieldName === 'foo' ? 1 : undefined} />
          </Form>
        );
      }
    }

    const CreatedForm = createForm()(FormForTest);
    const wrapper = mount(<CreatedForm fieldName="bar" />);
    expect(typeof wrapper.getNode().isValidValue).toBe('function');
    expect(wrapper.getNode().isValidValue(wrapper.find(Field).getNode(), '非空')).toBe(true);
  });

  // each of them has an unreachable else branch
  it('CreatedForm have attach and detach methods', () => {
    class FormForTest extends React.Component {
      static propTypes = {
        foo: React.PropTypes.bool.isRequired,
        bar: React.PropTypes.bool.isRequired
      }

      static defaultProps = {
        foo: true,
        bar: false
      }

      render() {
        const { foo, bar } = this.props;
        return (
          <Form>
            {foo && <Field name="foo" component={() => (<div className="foo-div" />)} validations={{ required: true }} validationErrors={{ required: '不能为空' }} />}
            {bar && <Field name="bar" component={() => (<div className="bar-div" />)} validations={{ required: true }} validationErrors={{ required: '不能为空' }} />}
          </Form>
        );
      }
    }

    const CreatedForm = createForm()(FormForTest);
    const wrapper = mount(<CreatedForm fieldName="bar" />);
    expect(wrapper.find(Field).length).toBe(1);
    expect(wrapper.find('.foo-div').length).toBe(1);
    wrapper.setProps({ foo: false, bar: true });
    expect(wrapper.find(Field).length).toBe(1);
    expect(wrapper.find('.bar-div').length).toBe(1);
  });

  it('CreatedForm have a validation system with Field', () => {
    class FormForThrow extends React.Component {
      render() {
        return (
          <Form>
            <Field name="foo" component={() => (<div className="bar-div" />)} validations={{ foo: true }} validationErrors={{ foo: 'bar' }} />
          </Form>
        );
      }
    }
    let TempForm = createForm()(FormForThrow);
    expect(() => { mount(<TempForm />) }).toThrow();

    class FormWithUndef extends React.Component {
      static propTypes = {
        vals: React.PropTypes.any
      }

      render() {
        const { vals } = this.props;
        return (
          <Form>
            <Field name="bar" component={() => (<div className="bar-div" />)} validations={vals} />
          </Form>
        );
      }
    }

    TempForm = createForm()(FormWithUndef);
    let tempWrapper = mount(<TempForm vals={{ required: true }} />);
    tempWrapper.setProps({ vals: undefined });
    expect(tempWrapper.find(Field).getNode()._validations).toBe(undefined);
    // HACK: branch
    tempWrapper.getNode().runValidation(tempWrapper.find(Field).getNode());

    class FormForTest extends React.Component {
      static propTypes = {
        hackSwitch: React.PropTypes.bool,
        showSwitch: React.PropTypes.shape({
          foo: React.PropTypes.bool,
          bar: React.PropTypes.bool,
          fooBar: React.PropTypes.bool,
        })
      }

      static defaultProps = {
        hackSwitch: false,
        showSwitch: {
          foo: true,
          bar: true,
          fooBar: true
        }
      }

      render() {
        const { hackSwitch, showSwitch } = this.props;
        return (
          <Form>
            {showSwitch.foo && <Field name="foo" component={() => (<div className="bar-div" />)} validations={{ required: true }} validationErrors={{ required: '不能为空' }} value={hackSwitch ? '占位' : ''} />}
            {showSwitch.bar && <Field name="bar" component={() => (<div className="bar-div" />)} validations={{ isNumeric: true }} validationErrors={{ isNumeric: '必须是数字' }} value={hackSwitch ? 12 : ''} />}
            {showSwitch.fooBar && <Field name="foo-bar" component={() => (<div className="bar-div" />)} validations={{ hackRule: () => (hackSwitch ? true : 'string supported') }} validationErrors={{ hackRule: 'just test' }} />}
          </Form>
        );
      }
    }

    const CreatedForm = createForm()(FormForTest);
    let wrapper = mount(<CreatedForm />);
    expect(wrapper.state('isFormValid')).toBe(false);
    wrapper.setProps({ hackSwitch: true });
    expect(wrapper.state('isFormValid')).toBe(true);
    expect(wrapper.find(Field).length).toBe(3);
    wrapper.setProps({ showSwitch: { foo: true, bar: true, fooBar: false } });
    expect(wrapper.find(Field).length).toBe(2);
    expect(wrapper.state('isFormValid')).toBe(true);
    wrapper.setProps({ validationErrors: { foo: 'foo', bar: 123 } });
    wrapper.unmount();
    wrapper.mount();
    expect(wrapper.state('isFormValid')).toBe(false);
    const external = wrapper.getNode().setFieldExternalErrors;
    expect(() => { external({ foo: 'bar', bar: 321 }) }).toThrow();
    wrapper = mount(<CreatedForm />);
    wrapper.setProps({ hackSwitch: true });
    wrapper.getNode().setFieldExternalErrors({ foo: 'bar', bar: 321 });

    // HACK: branch
    wrapper.unmount();
    wrapper.mount();
  });
});
