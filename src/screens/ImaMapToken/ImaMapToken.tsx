import Card from '@/components/Card/Card';
import Stepper from '@/components/Stepper/Stepper';
import { withErrorBoundary } from '@/elements/ErrorBoundary/ErrorBoundary';
import { useTokenManager } from '@/features/bridge';
import { NETWORK, StandardName } from '@/features/network/literals';
import ImaConnectToken from '@/screens/ImaConnectToken/ImaConnectToken';
import { useMapTokenContext } from '@/screens/ImaMapToken/hooks';
import { StepComplete } from '@/screens/ImaMapToken/StepComplete';
import { StepFourMainnet } from '@/screens/ImaMapToken/StepFourMainnet';
import { StepLast } from '@/screens/ImaMapToken/StepLast';
import { StepOne } from '@/screens/ImaMapToken/StepOne';
import { StepThree } from '@/screens/ImaMapToken/StepThree';
import { StepTwo } from '@/screens/ImaMapToken/StepTwo';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useSearchParams } from 'react-router-dom';
import { useNetwork } from 'wagmi';
import type {
  CloneTokenData,
  CloneTokenPreData,
  OriginTokenData,
  PermissionData,
} from './context';
import { ImaMapTokenContext } from './context';

export function ImaMapToken() {
  const { chain: activeChain, chains } = useNetwork();

  const { chainName } = useParams();
  const [searchParam] = useSearchParams();
  const originChainId = chains.find((c) => c.name === chainName)?.id;

  const standardName = searchParam.get('standard') as StandardName;

  const { standard, targetChain, originChain } = useMapTokenContext({
    standardName,
    targetChainId: Number(searchParam.get('t')),
    originChainId: originChainId,
  });
  const originIsForeign = originChain?.network !== NETWORK.SKALE;

  const { contract: tokenManager } = useTokenManager({
    standard,
    network: originChain?.network,
  });

  // form start

  const form = [
    useForm<OriginTokenData>({
      mode: 'all',
      reValidateMode: 'onChange',
      defaultValues: {
        originContractAddress: '',
      },
    }),
    useForm<CloneTokenData>({
      mode: 'all',
      reValidateMode: 'onChange',
      defaultValues: {
        cloneContractAddress: '',
      },
    }),
    useForm<CloneTokenPreData>({
      mode: 'all',
      reValidateMode: 'onChange',
      defaultValues: {
        name: '',
        symbol: '',
        decimals: 18,
      },
    }),
    useForm<PermissionData>({
      mode: 'all',
      reValidateMode: 'onChange',
      defaultValues: {
        tokenManagerRoleAddress: tokenManager?.address,
      },
    }),
  ] as const;

  const cloneContractAddress = form[1].watch('cloneContractAddress');
  const cloneContractAddressIsValid = !form[1].getFieldState(
    'cloneContractAddress',
  ).invalid;
  const tokenAddress = useMemo(() => {
    return cloneContractAddressIsValid ? cloneContractAddress : '';
  }, [cloneContractAddressIsValid]);

  // form end

  const steps: Parameters<typeof Stepper>[0]['steps'] = standard
    ? [
        {
          id: 'select-origin',
          label: `Select ${originIsForeign ? 'ethereum' : 'origin'} token`,
          content: ({ stepNext, stepPrev }) => (
            <StepOne stepNext={stepNext} stepPrev={stepPrev} />
          ),
        },
        {
          id: 'select-target',
          label: `Select clone token`,
          content: ({ stepNext, stepPrev }) => (
            <StepTwo stepNext={stepNext} stepPrev={stepPrev} />
          ),
        },
        {
          id: 'set-permissions',
          label: `Set permissions`,
          content: ({ stepPrev, stepNext }) => (
            <StepThree stepPrev={stepPrev} stepNext={stepNext} />
          ),
        },
        {
          id: 'map-token',
          label: `Confirm mapping`,
          content: ({ stepPrev, stepNext, markComplete }) => (
            <StepLast
              stepPrev={stepPrev}
              stepNext={stepNext}
              markComplete={markComplete}
            />
          ),
        },
      ]
    : [];

  const mainnetStep: Parameters<typeof Stepper>[0]['steps'][number] = {
    id: 'register-ethereum',
    label: `Register on ${originChain?.name}`,
    content: ({ stepPrev, stepNext }) => (
      <StepFourMainnet stepPrev={stepPrev} stepNext={stepNext} />
    ),
  };

  return standard ? (
    <ImaMapTokenContext.Provider
      value={{
        standard,
        originChain,
        targetChain,
        tokenAddress,
        forms: form,
      }}
    >
      <div className="grid h-full w-full rounded-lg bg-[var(--white)]">
        <Card full heading={`Add ${standard} with ${chainName}`}>
          <Stepper
            steps={
              !originIsForeign
                ? steps
                : [...steps.slice(0, 3), mainnetStep, ...steps.slice(3)]
            }
            completeElement={<StepComplete />}
            className="h-full grid grid-rows-[max-content_1fr]"
            bodyClass="flex flex-col h-full w-5/6 m-auto flex-wrap"
          />
        </Card>
      </div>
    </ImaMapTokenContext.Provider>
  ) : (
    <ImaConnectToken />
  );
}

export default withErrorBoundary(ImaMapToken);
