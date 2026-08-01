import React from 'react';
import { useTranslation } from 'next-i18next';
import Section from '../common/Section';
import SectionTitle from '../common/SectionTitle';
import Card from '../common/Card';
import { contactChannels } from '../../config/contactChannels';

const Contact: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <Section id="contact" background="default">
      <SectionTitle
        title={t('contact.title')}
        subtitle={t('contact.subtitle')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-3xl mx-auto px-4">
        {contactChannels.map((channel) => (
          <a
            key={channel.id}
            href={channel.buildHref(t)}
            aria-label={t(`${channel.i18nKey}.aria`)}
            {...(channel.external
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
            className="block md:only:col-span-2 md:only:w-full md:only:max-w-md md:only:justify-self-center"
          >
            <Card variant="raised" className="h-full text-center">
              <div className="flex flex-col items-center space-y-4">
                {/* Aquí el acento sí corresponde: la tarjeta entera es un
                    enlace, y el icono y el dato copiable son la acción. */}
                <span className="text-accent">{channel.icon}</span>
                <h3 className="text-xl md:text-2xl font-semibold text-text">
                  {t(`${channel.i18nKey}.label`)}
                </h3>
                <p className="text-text-muted text-base">
                  {t(`${channel.i18nKey}.description`)}
                </p>
                {channel.detail && (
                  <span className="select-all text-accent font-mono text-sm md:text-base break-all">
                    {channel.detail}
                  </span>
                )}
              </div>
            </Card>
          </a>
        ))}
      </div>
    </Section>
  );
};

export default Contact;
